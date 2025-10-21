import json
from datetime import datetime

def handle_submit_resource(event, headers, table_name):
    """Handle resource submission"""
    body = json.loads(event.get('body', '{}'))
    
    # Generate resource slug from name
    resource_name = body.get('resourceName', 'test-resource')
    resource_slug = resource_name.lower().replace(' ', '-').replace('_', '-')
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': 'Resource submitted successfully',
            'data': {
                'resourceSlug': resource_slug,
                'status': 'submitted',
                'title': body.get('resourceName', 'Test Resource'),
                'description': body.get('usagePurpose', 'Test Purpose'),
                'url': body.get('url', 'https://example.com'),
                'submissionTimestamp': datetime.utcnow().isoformat() + 'Z',
                'submitterEmail': body.get('companyEmail', 'test@example.com')
            }
        })
    }
