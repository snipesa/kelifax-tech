import json

def handle_get_resources(event, headers, table_name):
    """Handle getting submitted resources for admin"""
    query_params = event.get('queryStringParameters') or {}
    status_filter = query_params.get('status', 'submitted')
    
    # Mock submitted resources for testing
    mock_resources = [
        {
            'resourceSlug': 'github-test',
            'status': 'submitted',
            'title': 'GitHub',
            'description': 'Version control platform',
            'url': 'https://github.com',
            'tags': ['git', 'version-control'],
            'submissionTimestamp': '2024-10-16T10:30:00Z',
            'submitterEmail': 'test@example.com'
        },
        {
            'resourceSlug': 'vscode-test',
            'status': 'submitted',
            'title': 'VS Code',
            'description': 'Code editor',
            'url': 'https://code.visualstudio.com',
            'tags': ['editor', 'development'],
            'submissionTimestamp': '2024-10-16T09:15:00Z',
            'submitterEmail': 'dev@example.com'
        }
    ]
    
    # Filter by status
    filtered_resources = [r for r in mock_resources if r['status'] == status_filter]
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'data': filtered_resources,
            'count': len(filtered_resources)
        })
    }
