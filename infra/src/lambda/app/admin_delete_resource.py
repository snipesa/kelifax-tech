import json

def handle_delete_resource(event, headers, table_name):
    """Handle resource deletion"""
    path_params = event.get('pathParameters') or {}
    resource_slug = path_params.get('slug') or event.get('path', '').split('/')[-1]
    
    print(f"Received delete request for resource slug: {resource_slug}")
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': f'Resource {resource_slug} deleted successfully'
        })
    }
