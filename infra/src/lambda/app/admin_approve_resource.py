import json
import boto3
import os
from datetime import datetime
from app.utils import get_parameter

def handle_approve_resource(event, headers, table_name):
    """Handle resource approval - update status to approved and move logo"""
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Invalid JSON in request body'
            })
        }
    
    # Validate required fields
    resource_name = body.get('resourceName')
    if not resource_name:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'resourceName is required'
            })
        }
    
    # Generate resource slug from name (matching submit_resource.py pattern)
    resource_slug = generate_resource_slug(resource_name)
    
    dynamodb = boto3.client('dynamodb')
    
    try:
        # Get existing resource
        existing_item = dynamodb.get_item(
            TableName=table_name,
            Key={'resourceSlug': {'S': resource_slug}}
        )
        
        if 'Item' not in existing_item:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Resource not found'
                })
            }
        
        item = existing_item['Item']
        
        # Check if resource is in pending status
        current_status = item.get('resourceStatus', {}).get('S', '')
        if current_status != 'pending':
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Resource is not in pending status. Current status: {current_status}'
                })
            }
        
        # Prepare update with approval timestamp
        approval_timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Update DynamoDB item to approved status
        dynamodb.update_item(
            TableName=table_name,
            Key={'resourceSlug': {'S': resource_slug}},
            UpdateExpression='SET resourceStatus = :status, approvedAt = :approved_at',
            ExpressionAttributeValues={
                ':status': {'S': 'approved'},
                ':approved_at': {'S': approval_timestamp}
            }
        )
        
        # Handle logo file movement if logoImage exists
        logo_moved = False
        logo_filename = item.get('logoImage', {}).get('S', '')
        
        if logo_filename:
            logo_moved = move_logo_to_approved(logo_filename)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Resource approved successfully',
                'data': {
                    'resourceSlug': resource_slug,
                    'resourceName': resource_name,
                    'resourceStatus': 'approved',
                    'approvedAt': approval_timestamp,
                    'logoMoved': logo_moved
                }
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Database error occurred while approving resource',
                'error': str(e)
            })
        }


def generate_resource_slug(resource_name):
    """Generate URL-friendly slug from resource name"""
    import re
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', resource_name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def get_bucket_config():
    """
    Get S3 bucket configuration from parameter store based on environment
    
    Returns:
        tuple: (bucket_name, prefix) or (None, None) if error
        
    Example return values:
        - Dev: ('kelifax-resources', 'dev/')  
        - Prod: ('kelifax-resources', 'prod/')
    """
    try:
        # Get environment from OS environment variable
        environment = os.environ.get('ENVIRONMENT', 'dev').lower()
        
        # Determine parameter name based on environment
        if environment == 'prod':
            parameter_name = '/kelifax/prod/s3-bucket-url'
        else:
            parameter_name = '/kelifax/dev/s3-bucket-url'
        
        # Get bucket URL from parameter store
        bucket_url = get_parameter(parameter_name)
        
        if not bucket_url:
            print(f"No bucket URL found for parameter {parameter_name}")
            return None, None
            
        # Parse S3 URL: s3://kelifax-resources/dev/ -> bucket_name='kelifax-resources', prefix='dev/'
        if bucket_url.startswith('s3://'):
            parts = bucket_url[5:].split('/', 1)  # Remove 's3://' and split
            bucket_name = parts[0]
            prefix = parts[1] if len(parts) > 1 else ''
            return bucket_name, prefix
        else:
            print(f"Invalid S3 URL format: {bucket_url}")
            return None, None
            
    except Exception as e:
        print(f"Error getting bucket configuration: {e}")
        return None, None


def move_logo_to_approved(logo_filename):
    """
    Move logo file from logos/pending/ to logos/approved/
    
    Args:
        logo_filename (str): The logo filename (e.g., "Amazing_Dev_Tool.png")
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        bucket_name, prefix = get_bucket_config()
        
        if not bucket_name:
            print("Could not get bucket configuration")
            return False
            
        s3_client = boto3.client('s3')
        
        # Construct source and destination keys
        source_key = f"{prefix}logos/pending/{logo_filename}"
        dest_key = f"{prefix}logos/approved/{logo_filename}"
        
        # Check if source file exists
        try:
            s3_client.head_object(Bucket=bucket_name, Key=source_key)
        except s3_client.exceptions.NoSuchKey:
            print(f"Source logo file not found: {source_key}")
            return False
        
        # Copy file to approved location
        copy_source = {'Bucket': bucket_name, 'Key': source_key}
        s3_client.copy_object(
            CopySource=copy_source,
            Bucket=bucket_name,
            Key=dest_key
        )
        
        # Delete original file from pending location
        s3_client.delete_object(Bucket=bucket_name, Key=source_key)
        
        print(f"Successfully moved logo from {source_key} to {dest_key}")
        return True
        
    except Exception as e:
        print(f"Error moving logo file {logo_filename}: {e}")
        return False