import json
import base64
import binascii
import boto3
import os
from datetime import datetime
import uuid
from app.utils import get_parameter

def handle_upload_logo(event, headers):
    """Handle logo upload with file size validation"""
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
    if not body.get('file_name') or not body.get('image'):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Missing required fields: file_name and image'
            })
        }
    
    file_name = body.get('file_name')
    image_base64 = body.get('image')
    print(f"Received upload request for file: {file_name}")
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        
        # Check file size (600KB = 614,400 bytes)
        max_file_size = 600 * 1024  # 600KB in bytes
        if len(image_data) > max_file_size:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'File size exceeds maximum limit of 600KB. Current size: {len(image_data)} bytes'
                })
            }
        
        # Get environment variable for ENV (dev/prod)
        env = os.environ.get('ENVIRONMENT', 'dev')
        
        # Get bucket configuration from Parameter Store
        bucket_path = get_parameter(f'/kelifax/{env}/bucketResources')
        if not bucket_path:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Failed to get bucket configuration for environment: {env}'
                })
            }
        
        # Extract bucket name from s3://bucket-name/path/ format
        bucket_name = bucket_path.replace('s3://', '').split('/')[0]
        base_path = bucket_path.replace(f's3://{bucket_name}/', '')
        
        # Use the exact file name as received
        # S3 key with full path
        s3_key = f"{base_path}uploads/temp/{file_name}"
        
        # Get file extension for content type
        file_extension = file_name.split('.')[-1].lower() if '.' in file_name else 'png'
        
        # Upload to S3
        s3_client = boto3.client('s3')
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=image_data,
            ContentType=f'image/{file_extension}',
            Metadata={
                'original_filename': file_name,
                'upload_timestamp': str(datetime.now().isoformat()),
                'file_size': str(len(image_data))
            }
        )
        
        # Generate the S3 URL
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Logo uploaded successfully',
                'data': {
                    'file_url': s3_url,
                    's3_key': s3_key,
                    'original_filename': file_name,
                }
            })
        }
        
    except base64.binascii.Error:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Invalid base64 encoded image data'
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Failed to upload logo',
                'error': str(e)
            })
        }