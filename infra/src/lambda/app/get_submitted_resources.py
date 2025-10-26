import json
import boto3

def handle_get_submitted_resources(event, headers, table_name):
    """Handle getting submitted resources for admin"""
    query_params = event.get('queryStringParameters') or {}
    status_filter = query_params.get('status', 'submitted')
    
    # Scan DynamoDB for items with the specified status
    dynamodb = boto3.client('dynamodb')
    
    try:
        response = dynamodb.scan(
            TableName=table_name,
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': {'S': status_filter}}
        )
        
        # Format the resources from DynamoDB
        formatted_resources = []
        for item in response.get('Items', []):
            resource_data = json.loads(item['resource']['S'])
            formatted_resource = {
                'resourceSlug': item['resourceSlug']['S'],
                'status': item['status']['S'],
                'title': resource_data.get('title', ''),
                'description': resource_data.get('description', ''),
                'url': resource_data.get('url', ''),
                'tags': resource_data.get('tags', []),
                'category': resource_data.get('category', ''),
                'featured': resource_data.get('featured', False),
                'submissionTimestamp': item.get('submissionTimestamp', {}).get('S', ''),
                'submitterEmail': item.get('email', {}).get('S', '')
            }
            formatted_resources.append(formatted_resource)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': formatted_resources,
                'count': len(formatted_resources)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Error retrieving submitted resources',
                'error': str(e)
            })
        }
