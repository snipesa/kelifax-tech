import json
from datetime import datetime
import boto3

def handle_submit_resource(event, headers, table_name):
    """Handle resource submission"""
    body = json.loads(event.get('body', '{}'))
    
    if not body.get('resourceName'):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Resource name is required'
            })
        }
    
    # Generate resource slug from name
    resource_name = body['resourceName']
    resource_slug = resource_name.lower().replace(' ', '_')
    
    # Create resource dict
    resource_dict = {
        "slug": resource_slug,
        "title": resource_name,
        "description": body.get('usagePurpose', ''),
        "category": body.get('category', 'development').lower() if body.get('category') else 'development',
        "tags": body.get('tags', []),
        "url": body.get('resourceUrl', ''),
        "featured": False
    }
    
    # Save to DynamoDB
    dynamodb = boto3.client('dynamodb')
    submission_timestamp = datetime.utcnow().isoformat() + 'Z'
    
    item = {
        'resourceSlug': {'S': resource_slug},
        'status': {'S': 'submitted'},
        'email': {'S': body.get('companyEmail', '')},
        'resource': {'S': json.dumps(resource_dict)},
        'submissionTimestamp': {'S': submission_timestamp}
    }
    
    try:
        dynamodb.put_item(TableName=table_name, Item=item)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Resource with slug "{resource_slug}" may already exist or database error occurred'
            })
        }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': 'Resource submitted successfully',
            'data': {
                'resourceSlug': resource_slug,
                'status': 'submitted',
                'title': resource_name,
                'description': body.get('usagePurpose', ''),
                'url': body.get('resourceUrl', ''),
                'submissionTimestamp': submission_timestamp,
                'submitterEmail': body.get('companyEmail', '')
            }
        })
    }
