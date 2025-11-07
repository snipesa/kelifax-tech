import json
import urllib.request
import urllib.parse
import urllib.error
from urllib.parse import parse_qs

# ==== CONFIGURATION (from environment variables) ====
region = 'us-east-1'
cognito_domain = 'us-east-1xaf6zbond.auth.us-east-1.amazoncognito.com'
client_id = '44i4psi37nv58m1i96rb3me7sm'
redirect_uri = 'https://d3qbwqe1p23xd1.cloudfront.net/callback'
cookie_name = 'vNUThRYioKtl9OEvXnuwL5jrNA8Zxg8YINJdQIhHBQvyVYDdTS'

# ============================================

def lambda_handler(event, context):
    """
    Lambda@Edge function for Cognito authentication
    Python equivalent of the JavaScript version
    """
    try:
        print('Lambda@Edge function started')
        # print(f'Event: {json.dumps(event, default=str)}')  # Debug: Full event details
        
        request = event['Records'][0]['cf']['request']
        headers = request['headers']
        uri = request['uri']
        query = request['querystring']
        
        print(f'Request URI: {uri}')
        # print(f'Query string: {query}')  # Debug: Query parameters
        # print(f'Headers: {json.dumps(headers, default=str)}')  # Debug: All headers
        
        cookies = ''
        if 'cookie' in headers:
            cookies = ';'.join([c['value'] for c in headers['cookie']])
        # print(f'Cookies: {cookies}')  # Debug: Cookie details

        # --- Already logged in? Then allow ---
        if f'{cookie_name}=' in cookies:
            print('User has valid cookie - allowing request')
            return request

        # --- Coming back from Cognito with ?code=... ---
        if query and 'code=' in query:
            print('Processing callback with authorization code')
            params = parse_qs(query)
            
            if 'code' not in params:
                print('No authorization code found in callback')
                return redirect_to_login()

            print('Exchanging authorization code for tokens')
            post_data = urllib.parse.urlencode({
                'grant_type': 'authorization_code',
                'code': params['code'][0],
                'client_id': client_id,
                'redirect_uri': redirect_uri
            })

            # Fix: Extract hostname properly
            hostname = cognito_domain.replace('https://', '').replace('http://', '')
            # print(f'Token exchange hostname: {hostname}')  # Debug: Hostname extraction

            try:
                token_response = exchange_code_for_tokens(post_data, hostname)

                if token_response and 'id_token' in token_response:
                    print('Token exchange successful - setting cookie and redirecting')
                    # Set auth cookie and redirect home
                    return {
                        'status': '302',
                        'statusDescription': 'Found',
                        'headers': {
                            'set-cookie': [{
                                'key': 'Set-Cookie',
                                'value': f'{cookie_name}={token_response["id_token"]}; Secure; HttpOnly; Path=/; Max-Age=3600'
                            }],
                            'location': [{'key': 'Location', 'value': '/'}]
                        }
                    }
                else:
                    print('No id_token in response or invalid response')
                    return redirect_to_login()
                    
            except Exception as err:
                print(f'Token exchange failed: {err}')
                return redirect_to_login()

        # --- Not logged in → redirect to Cognito Hosted UI ---
        print('User not authenticated - redirecting to login')
        return redirect_to_login()
        
    except Exception as error:
        print(f'Lambda@Edge error: {error}')
        
        # Return error response
        return {
            'status': '500',
            'statusDescription': 'Internal Server Error',
            'body': 'Lambda function error'
        }

def exchange_code_for_tokens(post_data, hostname):
    """
    Exchange authorization code for tokens using urllib (no external dependencies)
    """
    try:
        # Create request
        req = urllib.request.Request(
            f'https://{hostname}/oauth2/token',
            data=post_data.encode('utf-8'),
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': len(post_data.encode('utf-8'))
            },
            method='POST'
        )
        
        print(f'Token exchange response status: Making request to {hostname}')
        # print(f'Token exchange request options: {post_data}')  # Debug: Request details

        # Make the request
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f'Token exchange response status: {response.getcode()}')
            # print(f'Token exchange response headers: {dict(response.headers)}')  # Debug: Response headers
            
            data = response.read().decode('utf-8')
            # print(f'Token exchange raw response: {data}')  # Debug: Raw response
            
            try:
                parsed_data = json.loads(data)
                # print(f'Token exchange parsed response: {json.dumps(parsed_data, default=str)}')  # Debug: Parsed response
                return parsed_data
            except json.JSONDecodeError as err:
                print(f'Failed to parse token response: {err}')
                return None
                
    except urllib.error.HTTPError as err:
        print(f'Token exchange request error: {err}')
        return None
    except Exception as err:
        print(f'Token exchange failed: {err}')
        return None

# --- Helper: redirect user to Cognito login ---
def redirect_to_login():
    """
    Helper function to redirect user to Cognito login
    """
    print('Redirecting to Cognito login page')
    login_url = f'https://{cognito_domain}/login?client_id={client_id}&response_type=code&scope=openid+email&redirect_uri={urllib.parse.quote(redirect_uri)}'
    # print(f'Login URL: {login_url}')  # Debug: Full login URL
    
    return {
        'status': '302',
        'statusDescription': 'Redirecting to Cognito',
        'headers': {
            'location': [{'key': 'Location', 'value': login_url}]
        }
    }


