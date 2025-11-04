import json
import os
from app.admin_auth import handle_admin_auth
from app.submit_resource import handle_submit_resource
from app.get_submitted_resources import handle_get_submitted_resources
from app.update_resource import handle_update_resource
from app.delete_resource import handle_delete_resource
from app.get_resource import handle_get_resource
from app.get_approved_resources import handle_get_approved_resources
from app.approve_resource import handle_approve_resource
from app.decline_resource import handle_decline_resource

from app.upload_logo import handle_upload_logo
from app.utils import get_parameter

def lambda_handler(event, context):
    # print(event)
    """
    Single Lambda function to handle all Kelifax API endpoints
    Routes: POST /resources, POST /admin, GET /resources, PATCH /resources/{slug}, DELETE /resources/{slug}
    """
    
    # Define allowed origins based on environment
    env = os.environ.get('ENVIRONMENT')
    
    # Verify environment variable exists
    if not env:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': False,
                'message': 'Configuration error: ENVIRONMENT variable not set',
                'error': 'Missing required environment variable: ENVIRONMENT'
            })
        }
    
    ALLOWED_ORIGINS = {
        'prod': [
            'https://kelifax.com',
            'https://www.kelifax.com'
        ],
        'dev': [
            'http://localhost:4321',
            'http://localhost:4322', 
            'http://localhost:4323',
            'https://www.d2zqbcv5saw2i9.cloudfront.net',
            'https://d2zqbcv5saw2i9.cloudfront.net'
        ]
    }
    
    allowed_origins = ALLOWED_ORIGINS.get(env, ALLOWED_ORIGINS['dev'])
    
    # Check origin header
    origin = event.get('headers', {}).get('origin', '')
    origin_lower = origin.lower()
    
    # Validate origin (case-insensitive comparison)
    valid_origin = None
    for allowed in allowed_origins:
        if origin_lower == allowed.lower():
            valid_origin = origin
            break
     # CORS headers for all responses (set early to ensure they're always included)
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': valid_origin or allowed_origins[0],  # Default to first allowed origin
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization, X-Amz-Date, X-Amz-Security-Token',
        'Access-Control-Max-Age': '86400'
    }

    # If origin is not allowed, return 403 WITH CORS headers
    if origin and not valid_origin:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Forbidden: Invalid origin',
                'origin': origin
            })
        }
    
    # Get DynamoDB table name from environment
    table_name = os.environ.get('DYNAMODB_TABLE', 'kelifax-resources')
    
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    method = event.get('httpMethod')
    path = event.get('path', '')
    
    try:
        # Route: POST /admin
        if method == 'POST' and path.endswith('/admin'):
            return handle_admin_auth(event, headers, table_name)
        
        # Route: POST /submit-resource (Submit Resource)
        elif method == 'POST' and path.endswith('/submit-resource'):
            return handle_submit_resource(event, headers, table_name)
        
        # Route: POST /resources existing resources in batches
        elif method == 'POST' and path.endswith('/resources'):
            return handle_get_approved_resources(event, headers, table_name)

        # Route: GET /resources (Get Submitted Resources for Admin)
        elif method == 'POST' and path.endswith('admin/submitted-resources'):
            return handle_get_submitted_resources(event, headers, table_name)
        
        # Route: POST /get-resource (Get Resource by Slug)
        elif method == 'POST' and path.endswith('/get-resource'):
            return handle_get_resource(event, headers, table_name)
        
        # Route: DELETE /delete-resource (Delete Resource by Slug)
        elif method == 'POST' and path.endswith('admin/delete-resource'):
            return handle_delete_resource(event, headers, table_name)
        
        # Route: POST /approve-resource (Approve Resource)
        elif method == 'POST' and path.endswith('admin/approve-resource'):
            return handle_approve_resource(event, headers, table_name)
        
        # Route: POST /decline-resource (Decline Resource)
        elif method == 'POST' and path.endswith('admin/decline-resource'):
            return handle_decline_resource(event, headers, table_name)
        
        # Route: POST /upload-logo (Upload Logo)
        elif method == 'POST' and path.endswith('/upload-logo'):
            return handle_upload_logo(event, headers)
      
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Endpoint not found'
                })
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Internal server error',
                'error': str(e)
            })
        }