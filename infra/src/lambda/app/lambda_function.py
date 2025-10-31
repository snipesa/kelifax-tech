import json
import os
from app.admin_auth import handle_admin_auth
from app.submit_resource import handle_submit_resource
from app.get_submitted_resources import handle_get_submitted_resources
from app.update_resource import handle_update_resource
from app.delete_resource import handle_delete_resource
from app.get_resource import handle_get_resource
from app.get_approved_resources import handle_get_approved_resources
from app.upload_logo import handle_upload_logo
from app.utils import get_parameter

def lambda_handler(event, context):
    # print(event)
    """
    Single Lambda function to handle all Kelifax API endpoints
    Routes: POST /resources, POST /admin-auth, GET /resources, PATCH /resources/{slug}, DELETE /resources/{slug}
    """
    
    # CORS headers for all responses
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization, X-Amz-Date, X-Amz-Security-Token',
        'Access-Control-Max-Age': '86400'
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
        # Route: POST /admin-auth
        if method == 'POST' and 'admin-auth' in path:
            return handle_admin_auth(event, headers, table_name)
        
        # Route: POST /submit-resource (Submit Resource)
        elif method == 'POST' and path.endswith('/submit-resource'):
            return handle_submit_resource(event, headers, table_name)
        
        # Route: POST /resources existing resources in batches
        elif method == 'POST' and path.endswith('/resources'):
            return handle_get_approved_resources(event, headers, table_name)

        # Route: GET /resources (Get Submitted Resources for Admin)
        elif method == 'GET' and path.endswith('/resources'):
            return handle_get_submitted_resources(event, headers, table_name)
        
        # Route: PATCH /resources/{slug} (Approve/Reject Resource)
        elif method == 'PATCH' and '/resources/' in path:
            return handle_update_resource(event, headers, table_name)
        
        # Route: DELETE /resources/{slug} (Delete Resource)
        elif method == 'DELETE' and '/resources/' in path:
            return handle_delete_resource(event, headers, table_name)
        
        # Route: POST /get-resource (Get Resource by Slug)
        elif method == 'POST' and path.endswith('/get-resource'):
            return handle_get_resource(event, headers, table_name)
        
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