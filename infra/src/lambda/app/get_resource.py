import boto3
import json

def parse_learning_resources(learning_resources_str):
    """
    Parse pipe-separated JSON learning resources string
    Returns list of dictionaries
    """
    # print("event", event)
    if not learning_resources_str:
        return []
    
    try:
        resources = []
        for resource_json in learning_resources_str.split('|'):
            if resource_json.strip():
                resources.append(json.loads(resource_json))
        return resources
    except json.JSONDecodeError:
        return []

def handle_get_resource(event, headers, table_name):
    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(table_name)

    # Parse the request body to get the slug
    body = json.loads(event.get('body', '{}'))
    resource_slug = body.get('slug')

    if not resource_slug:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Resource slug is required.'
            })
        }

    try:
        # Query DynamoDB for the resource
        response = table.get_item(Key={'resourceSlug': resource_slug})
        item = response.get('Item')

        if not item:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Resource not found.'
                })
            }

        # Only return approved resources to the public
        if item.get('resourceStatus') != 'approved':
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Resource not found.'
                })
            }

        # Transform DynamoDB item to frontend format
        resource_data = {
            'slug': item.get('resourceSlug', ''),
            'title': item.get('resourceName', ''),
            'name': item.get('resourceName', ''),
            'url': item.get('resourceUrl', ''),
            'description': item.get('usagePurpose', ''),
            'category': item.get('category', ''),
            'tags': item.get('tags', '').split(',') if item.get('tags') else [],
            'featured': item.get('featured', False),
            'image': item.get('logoImage', ''),
            'keyFeatures': item.get('keyFeatures', '').split('|') if item.get('keyFeatures') else [],
            'useCases': item.get('useCases', '').split('|') if item.get('useCases') else [],
            'learningResources': parse_learning_resources(item.get('learningResources', '')),
            'submittedAt': item.get('submittedAt', ''),
            'approvedAt': item.get('approvedAt', ''),
            'viewCount': int(item.get('viewCount', 0))
        }

        # Update view count (optional - can be done asynchronously)
        try:
            from datetime import datetime
            current_view_count = int(item.get('viewCount', 0))
            table.update_item(
                Key={'resourceSlug': resource_slug},
                UpdateExpression='ADD viewCount :inc SET lastViewed = :timestamp',
                ExpressionAttributeValues={
                    ':inc': 1,
                    ':timestamp': datetime.utcnow().isoformat() + 'Z'
                }
            )
            resource_data['viewCount'] = current_view_count + 1
        except Exception as view_error:
            # Don't fail the request if view count update fails
            pass

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': resource_data
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Failed to fetch resource.',
                'error': str(e)
            })
        }