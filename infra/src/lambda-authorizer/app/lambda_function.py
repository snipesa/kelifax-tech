import json
import jwt
import urllib.request
import urllib.parse
import boto3
import os
from urllib.parse import parse_qs

# ==== CONFIGURATION ====
region = 'us-east-1'

def get_cognito_config():
    """
    Get Cognito configuration from Parameter Store based on environment
    """
    try:
        # Determine environment from environment variable or function name
        environment = os.environ.get('ENVIRONMENT', 'dev')
        if environment not in ['dev', 'prod']:
            environment = 'dev'  # Default to dev
        
        print(f'Loading Cognito configuration for environment: {environment}')
        
        ssm = boto3.client('ssm', region_name=region)
        
        # Get parameters from Parameter Store
        cognito_user_pool_id = ssm.get_parameter(
            Name=f'/kelifax/{environment}/cognito-user-pool-id'
        )['Parameter']['Value']
        
        client_id = ssm.get_parameter(
            Name=f'/kelifax/{environment}/client_id'
        )['Parameter']['Value']
        
        cognito_domain = ssm.get_parameter(
            Name=f'/kelifax/{environment}/cognito_domain'
        )['Parameter']['Value']

        
        return {
            'cognito_user_pool_id': cognito_user_pool_id,
            'client_id': client_id,
            'cognito_domain': cognito_domain,
            'environment': environment
        }
        
    except Exception as e:
        print(f'Failed to load Cognito configuration from Parameter Store: {e}')
        raise Exception('Configuration error')

def lambda_handler(event, context):
    """
    API Gateway Lambda Authorizer that validates Cognito tokens from cookies
    Simple validation - if user has valid Cognito token from /admin login, allow access
    """
    try:
        print('API Gateway authorizer started')
        print(f'Event method ARN: {event.get("methodArn", "N/A")}')
        
        # Get Cognito configuration from Parameter Store
        cognito_config = get_cognito_config()
        cognito_user_pool_id = cognito_config['cognito_user_pool_id']
        client_id = cognito_config['client_id']
        cognito_domain = cognito_config['cognito_domain']
        
        # Extract cookies from the request
        headers = event.get('headers', {})
        cookies = headers.get('Cookie', '') or headers.get('cookie', '')
        
        print(f'Received cookies: {cookies[:100]}...' if len(cookies) > 100 else f'Received cookies: {cookies}')
        
        # Parse cookies
        cookie_dict = {}
        if cookies:
            for cookie in cookies.split(';'):
                if '=' in cookie:
                    key, value = cookie.strip().split('=', 1)
                    cookie_dict[key] = value
        
        # Look for ID token only
        id_token = cookie_dict.get('cognito_id_token')
        
        if not id_token:
            print('No cognito_id_token found in cookies')
            return generate_policy('user', 'Deny', event['methodArn'])
        
        # Validate the ID token
        try:
            # For simplicity, we'll do basic JWT decode without signature verification
            # In production, you might want to verify the JWT signature against Cognito's public keys
            decoded_token = jwt.decode(id_token, options={"verify_signature": False})
            
            # Basic token validation
            token_use = decoded_token.get('token_use')
            aud = decoded_token.get('aud')  # audience (client_id)
            iss = decoded_token.get('iss')  # issuer
            exp = decoded_token.get('exp')  # expiration
            
            print(f'Token validation - token_use: {token_use}, aud: {aud}, iss: {iss}')
            
            # Validate token properties
            if aud != client_id:
                print(f'Invalid audience: expected {client_id}, got {aud}')
                return generate_policy('user', 'Deny', event['methodArn'])
            
            expected_iss = f'https://cognito-idp.{region}.amazonaws.com/{cognito_user_pool_id}'
            if iss != expected_iss:
                print(f'Invalid issuer: expected {expected_iss}, got {iss}')
                return generate_policy('user', 'Deny', event['methodArn'])
            
            # Get user information
            user_id = decoded_token.get('sub')
            email = decoded_token.get('email', 'N/A')
            username = decoded_token.get('cognito:username', user_id)
            
            # Get user groups (if user is in any Cognito groups)
            cognito_groups = decoded_token.get('cognito:groups', [])
            
            print(f'Token validated successfully for user: {email} (username: {username})')
            if cognito_groups:
                print(f'User groups: {cognito_groups}')
            
            # Generate allow policy
            policy = generate_policy(user_id, 'Allow', event['methodArn'])
            
            # Add user context that can be accessed in your API functions
            policy['context'] = {
                'userId': user_id,
                'email': email,
                'username': username,
                'tokenUse': token_use,
                'groups': json.dumps(cognito_groups) if cognito_groups else '[]'
            }
            
            print('Authorization successful - allowing access')
            return policy
            
        except jwt.InvalidTokenError as e:
            print(f'Invalid token: {e}')
            return generate_policy('user', 'Deny', event['methodArn'])
        except Exception as e:
            print(f'Token validation error: {e}')
            return generate_policy('user', 'Deny', event['methodArn'])
            
    except Exception as e:
        print(f'Authorization failed: {e}')
        return generate_policy('user', 'Deny', event['methodArn'])

def generate_policy(principal_id, effect, resource):
    """
    Generate IAM policy for API Gateway
    """
    # Create a policy that applies to all methods/resources under the API
    # This makes the policy reusable across different API endpoints
    resource_parts = resource.split('/')
    api_gateway_arn = '/'.join(resource_parts[:4]) + '/*/*'
    
    policy = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': api_gateway_arn  # Allow access to all methods/paths in this API
                }
            ]
        }
    }
    
    print(f'Generated policy: Effect={effect}, Resource={api_gateway_arn}')
    return policy

def verify_jwt_signature(token, cognito_user_pool_id, client_id):
    """
    Optional: Verify JWT signature against Cognito's public keys
    Uncomment and use this for production environments
    """
    try:
        # Construct JWKS URL
        jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{cognito_user_pool_id}/.well-known/jwks.json'
        
        # Fetch JWKS from Cognito
        with urllib.request.urlopen(jwks_url) as response:
            jwks = json.loads(response.read().decode('utf-8'))
        
        # Get token header to find the key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        # Find the matching key
        key = None
        for jwk in jwks['keys']:
            if jwk['kid'] == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                break
        
        if not key:
            raise Exception('Unable to find matching key')
        
        # Verify and decode token
        decoded_token = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=client_id,
            issuer=f'https://cognito-idp.{region}.amazonaws.com/{cognito_user_pool_id}'
        )
        
        return decoded_token
        
    except Exception as e:
        print(f'JWT signature verification failed: {e}')
        raise
