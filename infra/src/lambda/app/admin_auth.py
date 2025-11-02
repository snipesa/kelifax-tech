import json
import uuid
import os
from datetime import datetime, timedelta
from app.utils import get_parameter

def handle_admin_auth(event, headers, table_name):
    """Handle admin authentication"""
    body = json.loads(event.get('body', '{}'))
    password = body.get('password', '')
    
    # Get environment and construct parameter path
    environment = os.environ.get('ENVIRONMENT', 'dev')
    param_name = f'/kelifax/{environment}/adminPassword'
    
    # Get stored password hash from Parameter Store
    stored_password_hash = get_parameter(param_name, decrypt=True)
    
    if not stored_password_hash:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Authentication service unavailable'
            })
        }
    
    # Compare the provided hash (already SHA-256) with stored hash
    if password == stored_password_hash:
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
                'message': 'Invalid password'
            })
        }
