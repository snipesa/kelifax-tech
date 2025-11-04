import json
import boto3

def handle_get_submitted_resources(event, headers, table_name):
    """Handle getting submitted resources for admin - only pending resources"""
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Invalid JSON in request body'
            })
        }
    
    # This function only returns pending resources
    status_filter = 'pending'
    
    # Scan DynamoDB for items with the specified status
    dynamodb = boto3.client('dynamodb')
    
    try:
        response = dynamodb.scan(
            TableName=table_name,
            FilterExpression='#resourceStatus = :resourceStatus',
            ExpressionAttributeNames={'#resourceStatus': 'resourceStatus'},
            ExpressionAttributeValues={':resourceStatus': {'S': status_filter}}
        )
        
        # Format the resources from DynamoDB
        formatted_resources = []
        for item in response.get('Items', []):
            # Parse tags from string to array
            tags_str = item.get('tags', {}).get('S', '')
            tags = [tag.strip() for tag in tags_str.split(',')] if tags_str else []
            
            formatted_resource = {
                'resourceSlug': item.get('resourceSlug', {}).get('S', ''),
                'resourceStatus': item.get('resourceStatus', {}).get('S', ''),
                'title': item.get('resourceName', {}).get('S', ''),
                'description': item.get('usagePurpose', {}).get('S', ''),
                'url': item.get('resourceUrl', {}).get('S', ''),
                'tags': tags,
                'category': item.get('category', {}).get('S', ''),
                'featured': item.get('featured', {}).get('BOOL', False),
                'submissionTimestamp': item.get('submittedAt', {}).get('S', ''),
                'submitterEmail': item.get('submitterEmail', {}).get('S', ''),
                'submitterName': f"{item.get('submitterFirstName', {}).get('S', '')} {item.get('submitterLastName', {}).get('S', '')}".strip(),
                'submitterCompany': item.get('submitterCompany', {}).get('S', ''),
                'logoImage': item.get('logoImage', {}).get('S', ''),
                'keyFeatures': item.get('keyFeatures', {}).get('S', ''),
                'useCases': item.get('useCases', {}).get('S', ''),
                'learningResources': item.get('learningResources', {}).get('S', '')
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
