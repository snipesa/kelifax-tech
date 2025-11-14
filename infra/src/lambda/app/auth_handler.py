import json

def check_admin_authorization(event, headers):
    """
    Check if the user is authorized to access admin endpoints
    Returns: (is_authorized: bool, error_response: dict or None)
    """
    # Get authorization context from API Gateway Lambda Authorizer
    request_context = event.get('requestContext', {})
    authorizer_context = request_context.get('authorizer', {})
    
    # Check if user is authenticated
    authenticated = authorizer_context.get('authenticated', 'false')
    if authenticated != 'true':
        auth_error = authorizer_context.get('authError', 'Authentication required')
        return False, {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Unauthorized: {auth_error}',
                'requiresAuth': True
            })
        }
    
    # Check if user has admin privileges
    groups_str = authorizer_context.get('groups', '[]')
    try:
        groups = json.loads(groups_str) if groups_str else []
    except:
        groups = []
    
    user_email = authorizer_context.get('email', '')
    
    # Define admin users - in production, move this to Parameter Store
    ADMIN_EMAILS = [
        'admin@kelifax.com',
        'ashimeetunyi@gmail.com'  # Replace with your admin email
    ]
    
    # Check if user is admin (either in admin group or in admin emails list)
    is_admin = (
        'admin' in groups or 
        'kelifax-admin' in groups or
        user_email in ADMIN_EMAILS
    )
    
    if not is_admin:
        return False, {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Forbidden: Admin privileges required',
                'userEmail': user_email,
                'userGroups': groups
            })
        }
    
    print(f'Admin access granted to user: {user_email} (groups: {groups})')
    return True, None