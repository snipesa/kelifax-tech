# DynamoDB Schema Recommendation for Resource Submission

## 🗄️ **Optimized DynamoDB Attribute Structure**

### **Table Design Philosophy**
- **Single Table Design**: Store all resource data in one table for optimal performance
- **Scalable Keys**: Use composite keys for efficient querying
- **Minimal Attributes**: Flatten nested objects to reduce complexity
- **GSI-Friendly**: Design attributes to support Global Secondary Indexes

---

## 📋 **Recommended DynamoDB Attributes**

### **Primary Key Structure**
```python
# Primary Key (Partition Key)
"resourceSlug": "amazing-dev-tool"  # String - URL-friendly identifier

# No Sort Key needed for simple resource lookup
```

### **Core Resource Attributes**
```python
{
    # PRIMARY KEY
    "resourceSlug": "amazing-dev-tool",  # String (PK)
    
    # METADATA ATTRIBUTES
    "submissionId": "uuid-v4-string",    # String - Unique submission tracking
    "resourceStatus": "pending",         # String - pending|approved|rejected
    "createdAt": "2025-10-25T10:30:00Z", # String (ISO 8601) - Used as sort key in GSIs
    "submittedAt": "2025-10-25T10:30:00Z",  # String (ISO 8601) - Same as createdAt for backward compatibility
    "approvedAt": "",                    # String (ISO 8601) - Empty if not approved
    "rejectedAt": "",                    # String (ISO 8601) - Empty if not rejected
    "rejectionReason": "",               # String - Empty if not rejected
    
    # SUBMITTER INFORMATION
    "submitterFirstName": "John",        # String
    "submitterLastName": "Doe",          # String
    "submitterEmail": "john@techcorp.com", # String
    "submitterCompany": "Tech Corp",     # String - Empty string if not provided
    "submitterPhone": "+1234567890",     # String - Empty string if not provided
    
    # BASIC RESOURCE INFO
    "resourceName": "Amazing Dev Tool",  # String
    "resourceUrl": "https://amazingdevtool.com", # String
    "usagePurpose": "This tool helps developers...", # String
    "category": "development",           # String
    "logoImage": "Amazing_Dev_Tool.png", # String - Filename or empty string
    "tags": "productivity,development,automation", # String - Comma-separated
    
    # DETAILED INFORMATION
    "keyFeatures": "Automated code generation|Integrated debugging tools|Real-time collaboration", # String - Pipe-separated
    "useCases": "Rapid prototyping for startups|Enterprise app development", # String - Pipe-separated
    "learningResources": '{"title":"Getting Started","url":"https://docs.com","type":"documentation"}|{"title":"Video Tutorial","url":"https://video.com","type":"video"}', # String - JSON objects pipe-separated
    
    # SEARCH & FILTERING ATTRIBUTES (OPTIONAL - Remove if not needed)
    "searchText": "amazing dev tool development productivity automation", # String - Combines name, category, tags, features for text search
    "featured": false,                   # Boolean - For highlighting featured resources
    
    # USE CASE: When user searches "automation tool", DynamoDB can filter where searchText contains "automation" AND "tool"
    # ALTERNATIVE: Remove this if you plan to use external search service (Elasticsearch, Algolia)
    
    # ANALYTICS ATTRIBUTES (Optional)
    "viewCount": 0,                     # Number - Track resource views
    "lastViewed": "",                   # String (ISO 8601) - Last view timestamp
    "submitterDomain": "techcorp.com",  # String - Extracted from email for analytics
}
```

---

## 🔍 **Global Secondary Index (GSI) Design**

### **GSI 1: ResourceStatusIndex** (CRITICAL - Required)
```python
# For admin functions and public all-categories listing
GSI_NAME: "ResourceStatusIndex"
PARTITION_KEY: "resourceStatus" # String (pending|approved|rejected)
SORT_KEY: "createdAt"          # String (ISO 8601) - Consistent chronological ordering

# Query Examples:
# - Get all pending resources (admin): resourceStatus = "pending"
# - Get all approved resources (public): resourceStatus = "approved"
# - Get recently submitted: resourceStatus = "pending", createdAt > "2025-10-01"
# - Pagination works reliably with createdAt sort key
```

### **GSI 2: CategoryIndex** (RECOMMENDED - For performance)
```python
# For public category-specific resource listing
GSI_NAME: "CategoryIndex"
PARTITION_KEY: "category"      # String (development|design|productivity, etc.)
SORT_KEY: "createdAt"          # String (ISO 8601) - Consistent chronological ordering

# Query Examples:
# - Get all development resources: category = "development"
# - Get recent design tools: category = "design", createdAt > "2025-10-01"
# - Pagination works reliably with createdAt sort key
# - Filter by status post-query: + FilterExpression resourceStatus = "approved"
```

### **Why createdAt as Sort Key for Both GSIs?**
1. **Consistent Ordering**: Resources always appear in chronological order
2. **Reliable Pagination**: No duplicate items across batches
3. **Admin Workflow**: Perfect for reviewing pending resources chronologically
4. **User Experience**: Newest approved resources appear first
5. **Performance**: Optimal for DynamoDB query patterns

---

## 🎯 **Attribute Design Rationale**

### **Why String Concatenation Instead of Lists/Maps?**

1. **DynamoDB Efficiency**: String attributes are more efficient than complex types
2. **Easier Querying**: Simple string operations vs complex nested queries
3. **Cost Optimization**: Reduced Read/Write Capacity Units
4. **Lambda Processing**: Easier to parse in Python than nested DynamoDB types

### **String Formats Used:**

#### **Tags**: Comma-separated
```python
"tags": "productivity,development,automation"
# Parse: tags.split(',')
```

#### **Key Features & Use Cases**: Pipe-separated strings
```python
# EXAMPLE: User submits these features in the form:
form_features = [
    "Real-time collaboration with team members",
    "Integrated debugging and testing tools", 
    "Automated code generation and refactoring"
]

# STORED IN DYNAMODB AS:
"keyFeatures": "Real-time collaboration with team members|Integrated debugging and testing tools|Automated code generation and refactoring"

# TO READ BACK:
features_list = item['keyFeatures'].split('|')
# Result: ["Real-time collaboration with team members", "Integrated debugging and testing tools", "Automated code generation and refactoring"]
```

#### **Learning Resources**: JSON objects pipe-separated
```python
# EXAMPLE: User submits these learning resources in the form:
form_learning_resources = [
    {"title": "Getting Started Guide", "url": "https://docs.com", "type": "documentation"},
    {"title": "Video Tutorial Series", "url": "https://youtube.com/watch", "type": "video"}
]

# STORED IN DYNAMODB AS:
"learningResources": '{"title":"Getting Started Guide","url":"https://docs.com","type":"documentation"}|{"title":"Video Tutorial Series","url":"https://youtube.com/watch","type":"video"}'

# TO READ BACK:
import json
resources_list = [json.loads(item) for item in item['learningResources'].split('|') if item]
# Result: [{"title": "Getting Started Guide", "url": "https://docs.com", "type": "documentation"}, {"title": "Video Tutorial Series", "url": "https://youtube.com/watch", "type": "video"}]
```

---

## 💡 **Scalability Considerations**

### **Partition Key Distribution**
- **Resource Slug**: Naturally distributed across partitions
- **Avoids Hot Partitions**: Each resource has unique slug
- **Predictable Access**: Direct access by slug for approved resources

### **Attribute Limits**
- **Item Size**: Keep under 400KB (DynamoDB limit)
- **String Attributes**: Max 400KB each (more than sufficient)
- **Attribute Count**: Stay under 50 attributes per item

### **Query Patterns Supported**
1. **Get Resource by Slug**: Direct PK lookup
2. **List All Approved Resources**: GSI query on ResourceStatusIndex (resourceStatus='approved')
3. **List Approved by Category**: GSI query on CategoryIndex + FilterExpression
4. **Admin: List Pending Resources**: GSI query on ResourceStatusIndex (resourceStatus='pending')
5. **Text Search**: Scan with filter on searchText (for simple search)
6. **Analytics Queries**: Filter by submitterDomain, viewCount, etc.

### **Optimal Query Strategy (Used in get_existing_resources.py)**
```python
# For category-specific requests:
if category_filter != 'all':
    # Use CategoryIndex - more efficient for specific categories
    query_params = {
        'IndexName': 'CategoryIndex',
        'KeyConditionExpression': Key('category').eq(category_filter),
        'FilterExpression': Key('resourceStatus').eq('approved'),  # Post-filter for status
        'ScanIndexForward': False  # Newest first
    }
else:
    # Use ResourceStatusIndex - most efficient for all approved resources
    query_params = {
        'IndexName': 'ResourceStatusIndex', 
        'KeyConditionExpression': Key('resourceStatus').eq('approved'),
        'ScanIndexForward': False  # Newest first
    }
```

---

## 🔧 **Python Lambda Implementation Helper Functions**

### **Attribute Conversion Functions**
```python
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
    return '|'.join(json.dumps(resource) for resource in resources_list)

def create_search_text(resource_name, tags, category, features):
    """Create searchable text from multiple fields"""
    search_parts = [
        resource_name.lower(),
        category.lower(),
        ' '.join(tags).lower() if tags else '',
        ' '.join(features).lower() if features else ''
    ]
    return ' '.join(filter(None, search_parts))
```

### **DynamoDB Item Creation**
```python
def create_dynamo_item(form_data, resource_slug):
    """
    Convert form submission to DynamoDB item format
    
    form_data: The JSON payload from frontend (matches your RESOURCE-SUBMISSION-SPECIFICATION.md structure)
    resource_slug: Generated slug like "amazing-dev-tool"
    
    EXAMPLE form_data structure:
    {
        "submitter": {"firstName": "John", "lastName": "Doe", "companyEmail": "john@techcorp.com", ...},
        "resource": {"resourceName": "Amazing Dev Tool", "category": "development", "tags": ["productivity"], ...},
        "details": {"keyFeatures": ["Feature 1", "Feature 2"], "useCases": ["Use case 1"], ...}
    }
    """
    return {
        'resourceSlug': resource_slug,
        'submissionId': str(uuid.uuid4()),
        'resourceStatus': 'pending',
        'createdAt': datetime.utcnow().isoformat() + 'Z',
        'submittedAt': datetime.utcnow().isoformat() + 'Z',  # Same as createdAt for backward compatibility
        'approvedAt': '',
        'rejectedAt': '',
        'rejectionReason': '',
        
        # Submitter info
        'submitterFirstName': form_data['submitter']['firstName'],
        'submitterLastName': form_data['submitter']['lastName'],
        'submitterEmail': form_data['submitter']['companyEmail'],
        'submitterCompany': form_data['submitter'].get('company', ''),
        'submitterPhone': form_data['submitter'].get('phoneNumber', ''),
        'submitterDomain': form_data['submitter']['companyEmail'].split('@')[1],
        
        # Resource info
        'resourceName': form_data['resource']['resourceName'],
        'resourceUrl': form_data['resource']['resourceUrl'],
        'usagePurpose': form_data['resource']['usagePurpose'],
        'category': form_data['resource']['category'],
        'logoImage': form_data['resource'].get('logoImage', ''),
        'tags': format_tags_for_dynamo(form_data['resource'].get('tags', [])),
        
        # Detailed info
        'keyFeatures': format_features_for_dynamo(form_data['details']['keyFeatures']),
        'useCases': format_features_for_dynamo(form_data['details']['useCases']),
        'learningResources': format_learning_resources_for_dynamo(
            form_data['details'].get('learningResources', [])
        ),
        
        # Search and display
        'searchText': create_search_text(
            form_data['resource']['resourceName'],
            form_data['resource'].get('tags', []),
            form_data['resource']['category'],
            form_data['details']['keyFeatures']
        ),
        'featured': False,
        'viewCount': 0,
        'lastViewed': ''
    }
```

---

## 🤔 **Do You Need SearchText?**

### **Option 1: Keep SearchText** (Recommended for MVP)
```python
# PRO: Simple search implementation using DynamoDB scan
# CON: Less efficient for large datasets
# GOOD FOR: Small to medium resource collections (< 10,000 items)

# Usage in Lambda:
response = dynamodb.scan(
    FilterExpression=Attr('searchText').contains('automation tool')
)
```

### **Option 2: Remove SearchText** (For Advanced Search)
```python
# PRO: More efficient, better search experience
# CON: Requires external search service
# GOOD FOR: Large resource collections, advanced search features

# Remove these lines from create_dynamo_item():
# 'searchText': create_search_text(...),  # DELETE THIS LINE

# Use Elasticsearch, Algolia, or AWS OpenSearch instead
```

### **Recommendation for Kelifax:**
- **Start with SearchText** for MVP - simple implementation
- **Remove later** when you implement advanced search with Elasticsearch/Algolia

---

## ✅ **Benefits of This Schema**

1. **Scalable**: Handles millions of resources with consistent performance
2. **Cost-Effective**: Optimized for minimal RCU/WCU usage
3. **Query-Friendly**: Supports common access patterns efficiently
4. **Simple**: Easy to implement and maintain in Lambda functions
5. **Extensible**: Easy to add new attributes without breaking existing code
6. **Search-Ready**: Built-in search text for basic text searching
7. **Analytics-Ready**: Includes attributes for tracking and analytics

This schema provides a solid foundation for the Kelifax resource submission system while maintaining DynamoDB best practices for scalability and performance.
