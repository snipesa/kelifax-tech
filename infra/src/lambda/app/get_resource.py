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

        # Extract the resource attribute from the DynamoDB item
        resource_data = item.get('resource')
        
        if not resource_data:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Resource data not found.',
                    'debug_item': item  # For debugging
                })
            }

        # The resource data should be a JSON string, parse it
        if isinstance(resource_data, str):
            try:
                parsed_resource = json.loads(resource_data)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'data': parsed_resource  # Return the parsed JSON object
                    })
                }
            except json.JSONDecodeError as e:
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'message': 'Invalid resource data format.',
                        'error': str(e),
                        'raw_data': resource_data
                    })
                }
        # If it's already a dict, use it as is
        elif isinstance(resource_data, dict):
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'data': resource_data
                })
            }
        else:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Unexpected resource data type.',
                    'data_type': str(type(resource_data)),
                    'raw_data': str(resource_data)
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