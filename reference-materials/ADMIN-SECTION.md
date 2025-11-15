# Kelifax Admin Section Documentation

## Overview
The Kelifax Admin Section provides administrative access to manage platform resources, including approving/declining submitted resources and deleting existing resources.

## Access
- **URL**: `{hostname}/admin`
- **Authentication**: AWS Cognito authentication required

## Authentication Flow
- **CloudFront Lambda@Edge**: Handles all authentication before requests reach the application
- **Cookie-Based Sessions**: JWT tokens stored securely in HTTP-only cookies
- **Lambda Authorizer**: API Gateway validates JWT tokens from cookies for all admin API calls
- **No Frontend Auth**: Frontend requires no authentication logic - handled entirely by CloudFront

## Admin Dashboard Features

### 1. Pending Resources Management
- **Purpose**: Review and manage submitted resources awaiting approval
- **Data Source**: Retrieved from backend after successful authentication
- **Display**: List of pending resources with basic information
- **Actions**: Approve or Decline each resource



#### Get Submitted Resources (Cookie Authentication)
```javascript
URL: {publicApiUrl}/admin/submitted-resources
Method: POST
Headers: {
  "Content-Type": "application/json"
  // JWT token automatically included via HTTP-only cookies
}
Body: {
  // Lambda Authorizer validates JWT from cookies automatically
}
```

#### Approve Resource
```javascript
URL: {publicApiUrl}/admin/approve-resource
Method: POST
Headers: {
  "Content-Type": "application/json"
  // JWT token automatically included via HTTP-only cookies
}
Body: {
  "resourceName": "exact_resource_name"
}
```

#### Decline Resource
```javascript
URL: {publicApiUrl}/admin/decline-resource
Method: POST
Headers: {
  "Content-Type": "application/json"
  // JWT token automatically included via HTTP-only cookies
}
Body: {
  "resourceName": "exact_resource_name"
}
```

### 2. Existing Resources Management
- **Purpose**: Manage currently published resources
- **Search**: Enter resource name to find specific resource
- **Display**: Shows basic resource information with delete option and resource status (approved/rejected) among the basic information

#### Get Resource for Deletion
```javascript
URL: {publicApiUrl}/get-resource
Method: POST
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "name": "resource_name" // Will be processed (lowercase, spaces->hyphens)
}
```

#### Delete Resource
```javascript
URL: {publicApiUrl}/admin/delete-resource
Method: POST
Headers: {
  "Content-Type": "application/json"
  // JWT token automatically included via HTTP-only cookies
}
Body: {
  "resourceName": "exact_resource_name"
}
```

## Admin UI Structure

### 1. Admin Access (`/admin`)
```
┌─────────────────────────────────────┐
│           Kelifax Admin             │
├─────────────────────────────────────┤
│  CloudFront handles authentication  │
│  automatically via Lambda@Edge      │
│                                     │
│  Direct access to admin dashboard   │
│  if authenticated via cookies       │
└─────────────────────────────────────┘
```

### 2. Admin Dashboard (`/admin/dashboard`)
```
┌─────────────────────────────────────────────────────────────┐
│  Kelifax Admin Dashboard                        [Logout]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── Pending Resources ───┐  ┌─── Manage Resources ───┐   │
│  │                         │  │                        │   │
│  │ • Resource 1            │  │ Search: [____________] │   │
│  │   [Approve] [Decline]   │  │        [Search]        │   │
│  │                         │  │                        │   │
│  │ • Resource 2            │  │ Results:               │   │
│  │   [Approve] [Decline]   │  │ • Found Resource       │   │
│  │                         │  │   [Delete]             │   │
│  │ • Resource 3            │  │                        │   │
│  │   [Approve] [Decline]   │  └────────────────────────┘   │
│  │                         │                               │
│  └─────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Requirements

### Frontend Files Needed
1. **`src/pages/admin.astro`** - Admin dashboard (no login page needed)
2. **`src/pages/admin/dashboard.astro`** - Main admin dashboard (if separate routing needed)
3. **`src/components/PendingResourcesList.astro`** - Pending resources management
4. **`src/components/ResourceManager.astro`** - Existing resources management
5. **`src/utils/admin-api.js`** - Admin API utilities (no auth utilities needed)

### Backend API Endpoints (Already Implemented)
- ✅ `/admin/submitted-resources` - Get submitted resources for approval
- ✅ `/admin/approve-resource` - Approve resource  
- ✅ `/admin/decline-resource` - Decline resource
- ✅ `/admin/delete-resource` - Delete resource
- ✅ `/get-resource` - Get resource details (POST request)
- ✅ Lambda Authorizer - JWT token validation from cookies

### Security Features
- **HTTP-Only Cookies**: Secure JWT token storage
- **Input Validation**: Backend validation for all admin inputs
- **Rate Limiting**: Admin endpoint protection
- **Audit Logging**: All admin actions logged



## Admin Workflow
1. **Authentication**: Admin visits `/admin` → Lambda@Edge validates JWT cookie → Access granted or redirect to Cognito
2. **Manage Pending**: Load pending resources → Approve/Decline actions → Database updates
3. **Manage Existing**: Search resources → Display details → Delete if needed

## Implementation Steps
1. Create admin dashboard page (`/admin`)
2. Configure CloudFront Lambda@Edge for authentication
3. Implement Lambda Authorizer for API Gateway
4. Build pending resources and resource management UI
5. Test and deploy

## Technical Notes
- **Resource Processing**: Resource names processed (lowercase, spaces→hyphens) for database operations
- **Request Methods**: Admin operations use POST requests for security
- **UI Requirements**: Responsive interface with clear user feedback

## API Summary
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|---------|
| **CloudFront Lambda@Edge** | **Viewer Request** | **Admin authentication via Cognito** | **🔄 To Configure** |
| **Lambda Authorizer** | **Token Validation** | **JWT cookie validation for API Gateway** | **🔄 To Configure** |
| `/admin/submitted-resources` | POST | Get pending resources | ✅ Implemented |
| `/admin/approve-resource` | POST | Approve submitted resource | ✅ Implemented |
| `/admin/decline-resource` | POST | Decline submitted resource | ✅ Implemented |
| `/get-resource` | POST | Get resource details | ✅ Implemented |
| `/admin/delete-resource` | POST | Delete existing resource | ✅ Implemented |
