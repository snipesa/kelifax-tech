import json
import os
from admin_auth import handle_admin_auth
from submit_resource import handle_submit_resource
from get_resources import handle_get_resources
from update_resource import handle_update_resource
from delete_resource import handle_delete_resource

def lambda_handler(event, context):
    print(event)
    """
    Single Lambda function to handle all Kelifax API endpoints
    Routes: POST /resources, POST /admin-auth, GET /resources, PATCH /resources/{slug}, DELETE /resources/{slug}
    """
    
    # CORS headers for all responses
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization'
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
        
        # Route: POST /resources (Submit Resource)
        elif method == 'POST' and path.endswith('/resources'):
            return handle_submit_resource(event, headers, table_name)
        
        # Route: GET /resources (Get Submitted Resources for Admin)
        elif method == 'GET' and path.endswith('/resources'):
            return handle_get_resources(event, headers, table_name)
        
        # Route: PATCH /resources/{slug} (Approve/Reject Resource)
        elif method == 'PATCH' and '/resources/' in path:
            return handle_update_resource(event, headers, table_name)
        
        # Route: DELETE /resources/{slug} (Delete Resource)
        elif method == 'DELETE' and '/resources/' in path:
            return handle_delete_resource(event, headers, table_name)
        
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