import boto3
import json

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
        response = table.get_item(Key={'slug': resource_slug})
        resource = response.get('Item')

        if not resource:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Resource not found.'
                })
            }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': resource
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