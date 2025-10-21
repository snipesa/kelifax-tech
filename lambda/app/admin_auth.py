import json
import uuid
from datetime import datetime, timedelta

def handle_admin_auth(event, headers, table_name):
    """Handle admin authentication"""
    body = json.loads(event.get('body', '{}'))
    password = body.get('password', '')
    
    # Simple password check for testing
    if password == 'admin':
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
