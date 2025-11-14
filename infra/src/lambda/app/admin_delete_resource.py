import json
import boto3
import os
from app.utils import get_parameter

def handle_delete_resource(event, headers, table_name):
    """Handle resource deletion"""
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
    
    # Validate required field
    resource_slug = body.get('slug')
    if not resource_slug:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Resource slug is required'
            })
        }
    
    print(f"Received delete request for resource slug: {resource_slug}")
    
    dynamodb = boto3.client('dynamodb')
    
    try:
        # Get existing resource to check its status and get logo filename
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
        
        # Get resource status and logo filename
        resource_status = item.get('resourceStatus', {}).get('S', '')
        logo_filename = item.get('logoImage', {}).get('S', '')
        
        # Delete logo file based on resource status
        logo_deleted = False
        if logo_filename:
            if resource_status == 'approved':
                logo_deleted = delete_logo_from_approved(logo_filename)
            elif resource_status == 'pending':
                logo_deleted = delete_logo_from_pending(logo_filename)
            else:
                print(f"Warning: Unknown resource status '{resource_status}', skipping logo deletion")
                logo_deleted = True  # Consider it successful to proceed with DynamoDB deletion
        else:
            logo_deleted = True  # No logo to delete
        
        # Delete item from DynamoDB
        dynamodb.delete_item(
            TableName=table_name,
            Key={'resourceSlug': {'S': resource_slug}}
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': f'Resource {resource_slug} deleted successfully',
                'data': {
                    'resourceSlug': resource_slug,
                    'resourceStatus': resource_status,
                    'logoDeleted': logo_deleted
                }
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Error occurred while deleting resource',
                'error': str(e)
            })
        }


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


def delete_logo_from_approved(logo_filename):
    """
    Delete logo file from logos/approved/ directory
    
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
        
        # Construct the file key
        file_key = f"{prefix}logos/approved/{logo_filename}"
        
        # Check if file exists
        try:
            s3_client.head_object(Bucket=bucket_name, Key=file_key)
        except s3_client.exceptions.NoSuchKey:
            print(f"Logo file not found in approved directory: {file_key}")
            return True  # Consider it successful since file doesn't exist
        
        # Delete the file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        
        print(f"Successfully deleted logo from approved directory: {file_key}")
        return True
        
    except Exception as e:
        print(f"Error deleting logo file from approved directory {logo_filename}: {e}")
        return False


def delete_logo_from_pending(logo_filename):
    """
    Delete logo file from logos/pending/ directory
    
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
        
        # Construct the file key
        file_key = f"{prefix}logos/pending/{logo_filename}"
        
        # Check if file exists
        try:
            s3_client.head_object(Bucket=bucket_name, Key=file_key)
        except s3_client.exceptions.NoSuchKey:
            print(f"Logo file not found in pending directory: {file_key}")
            return True  # Consider it successful since file doesn't exist
        
        # Delete the file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        
        print(f"Successfully deleted logo from pending directory: {file_key}")
        return True
        
    except Exception as e:
        print(f"Error deleting logo file from pending directory {logo_filename}: {e}")
        return False
