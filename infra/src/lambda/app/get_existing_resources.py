import json
import boto3
import base64
from boto3.dynamodb.conditions import Key
from decimal import Decimal

def decimal_default(obj):
    """Convert Decimal to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handle_get_existing_resources(event, headers, table_name):
    """
    Get approved resources for public listing page in batches
    Returns minimal data: slug, title, description, category, tags, featured, image
    """
    # Configuration variables
    region = 'us-east-1'
    status_gsi_name = 'StatusIndex'      # status + createdAt
    category_gsi_name = 'CategoryIndex'  # category + createdAt
    default_batch_size = 10
    max_batch_size = 50
    
    try:
        print(f"Getting existing resources from table: {table_name}")
        
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        # Parse request body for parameters
        body = {}
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                print("Invalid JSON in request body")
        
        # Get parameters from request body or query params
        query_params = event.get('queryStringParameters') or {}
        batch_size = min(
            int(body.get('batchSize', query_params.get('batchSize', default_batch_size))),
            max_batch_size
        )
        page_token = body.get('pageToken', query_params.get('pageToken'))
        category_filter = body.get('category', query_params.get('category', 'all'))
        
        print(f"Request params - batchSize: {batch_size}, category: {category_filter}")
        
        # Handle pagination token
        exclusive_start_key = None
        if page_token:
            try:
                exclusive_start_key = json.loads(base64.b64decode(page_token).decode())
                print(f"Using pagination token")
            except Exception as e:
                print(f"Invalid pagination token: {e}")
        
        # Choose optimal GSI based on category filter
        if category_filter != 'all':
            # Use CategoryIndex for specific category (more efficient)
            query_params_dynamo = {
                'IndexName': category_gsi_name,
                'KeyConditionExpression': Key('category').eq(category_filter),
                'FilterExpression': Key('status').eq('approved'),
                'ScanIndexForward': False,  # Newest first (createdAt descending)
                'Limit': batch_size,
                'ProjectionExpression': (
                    'resourceSlug, resourceName, usagePurpose, category, '
                    'tags, featured, logoImage, status, createdAt'
                )
            }
            print(f"Using CategoryIndex for category: {category_filter}")
        else:
            # Use StatusIndex for all categories (most efficient for approved-only)
            query_params_dynamo = {
                'IndexName': status_gsi_name,
                'KeyConditionExpression': Key('status').eq('approved'),
                'ScanIndexForward': False,  # Newest first (createdAt descending)
                'Limit': batch_size,
                'ProjectionExpression': (
                    'resourceSlug, resourceName, usagePurpose, category, '
                    'tags, featured, logoImage, status, createdAt'
                )
            }
            print("Using StatusIndex for all approved resources")
        
        if exclusive_start_key:
            query_params_dynamo['ExclusiveStartKey'] = exclusive_start_key
        
        print(f"Executing DynamoDB query for approved resources")
        
        response = table.query(**query_params_dynamo)
        items = response.get('Items', [])
        
        print(f"Retrieved {len(items)} approved resources")
        
        # Format resources for frontend (matching resources.json structure)
        formatted_resources = []
        for item in items:
            try:
                # Parse comma-separated tags
                tags_list = []
                if item.get('tags'):
                    tags_list = [tag.strip() for tag in item['tags'].split(',') if tag.strip()]
                
                # Create resource object matching frontend expectations
                resource = {
                    'slug': item.get('resourceSlug', ''),
                    'title': item.get('resourceName', ''),
                    'description': item.get('usagePurpose', ''),
                    'category': item.get('category', ''),
                    'tags': tags_list,
                    'featured': item.get('featured', False),
                    'image': item.get('logoImage', '')
                }
                
                # Only add resource if it has required fields
                if resource['slug'] and resource['title']:
                    formatted_resources.append(resource)
                
            except Exception as e:
                print(f"Error formatting resource {item.get('resourceSlug', 'unknown')}: {e}")
                continue
        
        # Convert Decimal types for JSON serialization
        formatted_resources = json.loads(
            json.dumps(formatted_resources, default=decimal_default)
        )
        
        # Create next page token for pagination
        next_page_token = None
        if 'LastEvaluatedKey' in response:
            next_page_token = base64.b64encode(
                json.dumps(response['LastEvaluatedKey']).encode()
            ).decode()
        
        print(f"Returning {len(formatted_resources)} resources")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': {
                    'resources': formatted_resources,
                    'pagination': {
                        'hasMore': next_page_token is not None,
                        'nextPageToken': next_page_token,
                        'batchSize': batch_size,
                        'count': len(formatted_resources),
                        'category': category_filter
                    }
                }
            })
        }
        
    except Exception as e:
        print(f"Error in handle_get_existing_resources: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Failed to retrieve existing resources',
                'error': str(e)
            })
        }