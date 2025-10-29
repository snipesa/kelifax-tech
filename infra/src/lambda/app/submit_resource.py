import json
from datetime import datetime
import boto3
import uuid
import re
import os
from app.utils import get_parameter

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
        
        # Handle logo file management if logoImage exists
        logo_processed = False
        if resource.get('logoImage'):
            logo_processed = move_logo_to_pending(resource['logoImage'])
        
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
                'logoProcessed': logo_processed
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


def get_bucket_config():
    """
    Get S3 bucket configuration from parameter store based on environment
    
    Returns:
        tuple: (bucket_name, prefix) or (None, None) if error
        
    Example return values:
        - Dev: ('kelifax-resources', 'dev/')  
        - Prod: ('kelifax-resources', 'prod/')
    """
    try:
        # Get environment from OS environment variable
        environment = os.environ.get('ENV', 'dev').lower()
        
        # Determine parameter name based on environment
        if environment == 'prod':
            parameter_name = '/kelifax/prod/bucketResources'
        else:
            parameter_name = '/kelifax/dev/bucketResources'
        
        # Get bucket URL from parameter store
        bucket_url = get_parameter(parameter_name)
        
        if not bucket_url:
            print(f"Could not retrieve bucket configuration from parameter: {parameter_name}")
            return None, None
            
        # Parse S3 URL: s3://kelifax-resources/dev/ -> bucket_name='kelifax-resources', prefix='dev/'
        if bucket_url.startswith('s3://'):
            # Remove s3:// prefix
            bucket_path = bucket_url[5:]
            
            # Split bucket name and prefix
            if '/' in bucket_path:
                bucket_name = bucket_path.split('/')[0]
                prefix = '/'.join(bucket_path.split('/')[1:])
                
                # Ensure prefix ends with '/' if not empty
                if prefix and not prefix.endswith('/'):
                    prefix += '/'
                    
                return bucket_name, prefix
            else:
                # No prefix in URL
                return bucket_path, ''
        else:
            print(f"Invalid S3 URL format: {bucket_url}")
            return None, None
            
    except Exception as e:
        print(f"Error getting bucket configuration: {e}")
        return None, None


def move_logo_to_pending(logo_filename):
    """
    Move logo file from uploads/temp/ to logos/pending/
    
    Args:
        logo_filename (str): The logo filename (e.g., "Amazing_Dev_Tool.png")
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        bucket_name, prefix = get_bucket_config()
        
        if not bucket_name:
            print("Could not get bucket configuration - skipping logo processing")
            return False
            
        s3_client = boto3.client('s3')
        
        # Construct source and destination keys
        source_key = f"{prefix}uploads/temp/{logo_filename}"
        dest_key = f"{prefix}logos/pending/{logo_filename}"
        
        # Check if source file exists
        try:
            s3_client.head_object(Bucket=bucket_name, Key=source_key)
        except s3_client.exceptions.NoSuchKey:
            print(f"Source logo file not found: s3://{bucket_name}/{source_key}")
            return False
        
        # Copy file to pending location
        copy_source = {'Bucket': bucket_name, 'Key': source_key}
        s3_client.copy_object(
            CopySource=copy_source,
            Bucket=bucket_name,
            Key=dest_key
        )
        
        # Delete original file from temp location
        s3_client.delete_object(Bucket=bucket_name, Key=source_key)
        
        print(f"Successfully moved logo from {source_key} to {dest_key}")
        return True
        
    except Exception as e:
        print(f"Error moving logo file {logo_filename}: {e}")
        return False


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
