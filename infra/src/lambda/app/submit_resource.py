import json
from datetime import datetime
import boto3
import uuid
import re

def handle_submit_resource(event, headers, table_name):
    """Handle resource submission according to RESOURCE-SUBMISSION-SPECIFICATION.md"""
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
    
    # Validate required structure
    if not all(key in body for key in ['submitter', 'resource', 'details']):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Missing required sections: submitter, resource, details'
            })
        }
    
    # Validate required fields
    submitter = body.get('submitter', {})
    resource = body.get('resource', {})
    details = body.get('details', {})
    
    required_submitter_fields = ['firstName', 'lastName', 'companyEmail']
    required_resource_fields = ['resourceName', 'usagePurpose', 'resourceUrl', 'category']
    required_details_fields = ['keyFeatures', 'useCases']
    
    # Check required submitter fields
    for field in required_submitter_fields:
        if not submitter.get(field):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Missing required submitter field: {field}'
                })
            }
    
    # Check required resource fields
    for field in required_resource_fields:
        if not resource.get(field):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Missing required resource field: {field}'
                })
            }
    
    # Check required details fields
    for field in required_details_fields:
        if not details.get(field) or len(details.get(field, [])) == 0:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Missing required details field: {field}'
                })
            }
    
    # Generate resource slug from name
    resource_name = resource['resourceName']
    resource_slug = generate_resource_slug(resource_name)
    
    # Create DynamoDB item according to schema
    dynamo_item = create_dynamo_item(body, resource_slug)
    
    # Save to DynamoDB
    dynamodb = boto3.client('dynamodb')
    
    try:
        # Check if resource slug already exists
        existing_item = dynamodb.get_item(
            TableName=table_name,
            Key={'resourceSlug': {'S': resource_slug}}
        )
        
        if 'Item' in existing_item:
            return {
                'statusCode': 409,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'A resource with this name already exists in the database',
                    'error': f'Resource slug "{resource_slug}" is already taken'
                })
            }
        
        # Put new item
        dynamodb.put_item(TableName=table_name, Item=dynamo_item)
        
        # TODO: Move logo from uploads/temp/ to logos/pending/ if logoImage exists
        # This will be handled when S3 integration is added
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': 'Database error occurred while saving resource',
                'error': str(e)
            })
        }
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': 'Resource submitted successfully',
            'data': {
                'resourceSlug': resource_slug,
                'submissionId': dynamo_item['submissionId']['S'],
                'resourceStatus': 'pending',
                'logoProcessed': bool(resource.get('logoImage'))
            }
        })
    }


def generate_resource_slug(resource_name):
    """Generate URL-friendly slug from resource name"""
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', resource_name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def format_tags_for_dynamo(tags_list):
    """Convert list to comma-separated string"""
    return ','.join(tags_list) if tags_list else ''


def format_features_for_dynamo(features_list):
    """Convert list to pipe-separated string"""
    # Note: Frontend validation ensures no pipe characters in individual features
    return '|'.join(features_list) if features_list else ''


def format_learning_resources_for_dynamo(resources_list):
    """Convert list of dicts to pipe-separated JSON strings"""
    if not resources_list:
        return ''
    # Note: Frontend validation ensures no pipe characters in resource titles
    return '|'.join(json.dumps(resource, separators=(',', ':')) for resource in resources_list)


def create_search_text(resource_name, tags, category, features):
    """Create searchable text from multiple fields"""
    search_parts = [
        resource_name.lower(),
        category.lower(),
        ' '.join(tags).lower() if tags else '',
        ' '.join(features).lower() if features else ''
    ]
    return ' '.join(filter(None, search_parts))


def create_dynamo_item(form_data, resource_slug):
    """
    Convert form submission to DynamoDB item format
    
    form_data: The JSON payload from frontend (matches RESOURCE-SUBMISSION-SPECIFICATION.md structure)
    resource_slug: Generated slug like "amazing-dev-tool"
    """
    submitter = form_data['submitter']
    resource = form_data['resource']
    details = form_data['details']
    
    submission_timestamp = datetime.utcnow().isoformat() + 'Z'
    submission_id = str(uuid.uuid4())
    
    return {
        # Primary Key
        'resourceSlug': {'S': resource_slug},
        
        # Metadata
        'submissionId': {'S': submission_id},
        'resourceStatus': {'S': 'pending'},
        'submittedAt': {'S': submission_timestamp},
        'approvedAt': {'S': ''},
        'rejectedAt': {'S': ''},
        'rejectionReason': {'S': ''},
        
        # Submitter Information
        'submitterFirstName': {'S': submitter['firstName']},
        'submitterLastName': {'S': submitter['lastName']},
        'submitterEmail': {'S': submitter['companyEmail']},
        'submitterCompany': {'S': submitter.get('company', '')},
        'submitterPhone': {'S': submitter.get('phoneNumber', '')},
        'submitterDomain': {'S': submitter['companyEmail'].split('@')[1] if '@' in submitter['companyEmail'] else ''},
        
        # Resource Information
        'resourceName': {'S': resource['resourceName']},
        'resourceUrl': {'S': resource['resourceUrl']},
        'usagePurpose': {'S': resource['usagePurpose']},
        'category': {'S': resource['category']},
        'logoImage': {'S': resource.get('logoImage', '')},
        'tags': {'S': format_tags_for_dynamo(resource.get('tags', []))},
        
        # Detailed Information
        'keyFeatures': {'S': format_features_for_dynamo(details['keyFeatures'])},
        'useCases': {'S': format_features_for_dynamo(details['useCases'])},
        'learningResources': {'S': format_learning_resources_for_dynamo(details.get('learningResources', []))},
        
        # Search and Analytics
        'searchText': {'S': create_search_text(
            resource['resourceName'],
            resource.get('tags', []),
            resource['category'],
            details['keyFeatures']
        )},
        'featured': {'BOOL': False},
        'viewCount': {'N': '0'},
        'lastViewed': {'S': ''}
    }
