import json
import boto3
import os
from datetime import datetime
from app.utils import get_parameter

def handle_decline_resource(event, headers, table_name):
    """Handle resource decline - update status to rejected and remove logo"""
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
    resource_slug = body.get('slug')
    if not resource_slug:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'slug is required'
            })
        }
    
    # Optional rejection reason
    rejection_reason = body.get('rejectionReason', 'No reason provided')
    
    # Generate resource slug for validation (second authentication)
    validated_resource_slug = generate_resource_slug(resource_slug)
    
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
        
        # Prepare update with rejection timestamp
        rejection_timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Handle logo file removal if logoImage exists
        logo_removed = False
        logo_filename = item.get('logoImage', {}).get('S', '')
        
        if logo_filename:
            logo_removed = remove_pending_logo(logo_filename)
        
        # Update DynamoDB item to rejected status
        update_expression = 'SET resourceStatus = :status, rejectedAt = :rejected_at, rejectionReason = :reason'
        expression_values = {
            ':status': {'S': 'rejected'},
            ':rejected_at': {'S': rejection_timestamp},
            ':reason': {'S': rejection_reason}
        }
        
        # Clear logoImage field only if logo was successfully removed
        if logo_filename and logo_removed:
            update_expression += ', logoImage = :empty_logo'
            expression_values[':empty_logo'] = {'S': ''}
        
        dynamodb.update_item(
            TableName=table_name,
            Key={'resourceSlug': {'S': resource_slug}},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Resource declined successfully',
                'data': {
                    'resourceSlug': resource_slug,
                    'resourceStatus': 'rejected',
                    'rejectedAt': rejection_timestamp,
                    'rejectionReason': rejection_reason,
                    'logoRemoved': logo_removed
                }
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Database error occurred while declining resource',
                'error': str(e)
            })
        }


def generate_resource_slug(resource_name):
    """Generate URL-friendly slug from resource name"""
    import re
    # Simple slug generation: lowercase, replace spaces and underscores with hyphens
    slug = resource_name.lower()
    slug = re.sub(r'[\s_]+', '-', slug)  # Replace spaces and underscores with hyphens
    return slug


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
            parameter_name = '/kelifax/prod/bucketResources'
        else:
            parameter_name = '/kelifax/dev/bucketResources'
        
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


def remove_pending_logo(logo_filename):
    """
    Remove logo file from logos/pending/ folder
    
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
        
        # Construct source key
        source_key = f"{prefix}logos/pending/{logo_filename}"
        
        # Check if source file exists
        try:
            s3_client.head_object(Bucket=bucket_name, Key=source_key)
        except s3_client.exceptions.NoSuchKey:
            print(f"Pending logo file not found: {source_key}")
            return False
        
        # Delete file from pending location
        s3_client.delete_object(Bucket=bucket_name, Key=source_key)
        
        print(f"Successfully removed logo from {source_key}")
        return True
        
    except Exception as e:
        print(f"Error removing logo file {logo_filename}: {e}")
        return False