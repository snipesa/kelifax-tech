import json
from datetime import datetime

def handle_update_resource(event, headers, table_name):
    """Handle resource approval/rejection"""
    path_params = event.get('pathParameters') or {}
    resource_slug = path_params.get('slug') or event.get('path', '').split('/')[-1]
    body = json.loads(event.get('body', '{}'))
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': f'Resource {resource_slug} updated successfully',
            'data': {
                'resourceSlug': resource_slug,
                'resourceStatus': body.get('resourceStatus', 'approved'),
                'updatedAt': datetime.utcnow().isoformat() + 'Z'
            }
        })
    }
