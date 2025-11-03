import json
import uuid
import os
from datetime import datetime, timedelta
from app.utils import get_parameter

def handle_admin_auth(event, headers, table_name):
    """Handle admin authentication"""
    body = json.loads(event.get('body', '{}'))
    username = body.get('username', '')
    password = body.get('password', '')
    
    # Get environment and construct parameter paths
    environment = os.environ.get('ENVIRONMENT', 'dev')
    username_param = f'/kelifax/{environment}/adminUsername'
    password_param = f'/kelifax/{environment}/adminPassword'
    
    # Get stored credentials from Parameter Store
    # stored_username = get_parameter(username_param, decrypt=True)
    stored_username = "admin"
    stored_password_hash = get_parameter(password_param, decrypt=True)
    
    if not stored_username or not stored_password_hash:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Authentication service unavailable'
            })
        }
    
    # Compare both username and password hash
    if username == stored_username and password == stored_password_hash:
        session_token = str(uuid.uuid4())
        expires_at = (datetime.utcnow() + timedelta(hours=2)).isoformat() + 'Z'
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Authentication successful',
                'data': {
                    'sessionToken': session_token,
                    'expiresAt': expires_at,
                    'userRole': 'admin'
                }
            })
        }
    else:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Invalid credentials'
            })
        }
