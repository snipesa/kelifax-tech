# Kelifax Admin Section Documentation

## Overview
The Kelifax Admin Section provides administrative access to manage platform resources, including approving/declining submitted resources and deleting existing resources.

## Access
- **URL**: `{hostname}/admin`
- **Authentication**: AWS Cognito authentication required

## Authentication Flow

### 1. Admin Access Page (`/admin`)
- User visits admin page
- System checks for valid Cognito authentication
- If not authenticated, redirects to Cognito hosted UI for login

### 2. Cognito Authentication Redirect
```javascript
// Redirect to Cognito hosted UI
URL: https://{cognitoDomain}/login?client_id={clientId}&response_type=code&scope=openid+profile+email&redirect_uri={redirectUri}

// Example redirect URL structure:
// https://kelifax-auth.auth.us-east-1.amazoncognito.com/login
//   ?client_id=abc123def456
//   &response_type=code
//   &scope=openid+profile+email
//   &redirect_uri=https://kelifax.com/admin/callback
```

### 3. Cognito Authentication Response
- **Success**: Cognito returns authorization code to callback URL
- **Authorization Code Exchange**: Frontend exchanges code for access/ID tokens
- **Token Storage**: Tokens stored securely (sessionStorage/localStorage)
- **Dashboard Access**: User redirected to admin dashboard with valid tokens

## Admin Dashboard Features

### 1. Pending Resources Management
- **Purpose**: Review and manage submitted resources awaiting approval
- **Data Source**: Retrieved from backend after successful authentication
- **Display**: List of pending resources with basic information
- **Actions**: Approve or Decline each resource

#### Get Submitted Resources (After Authentication)
```javascript
URL: {publicApiUrl}/admin-auth/submitted-resources
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {session_token}"
}
Body: {
  // Authentication token validates access
}
```

#### Approve Resource
```javascript
URL: {publicApiUrl}/admin-auth/approve-resource
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {session_token}"
}
Body: {
  "resourceName": "exact_resource_name"
}
```

#### Decline Resource
```javascript
URL: {publicApiUrl}/admin-auth/decline-resource
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {session_token}"
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
URL: {publicApiUrl}/admin-auth/delete-resource
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {session_token}"
}
Body: {
  "resourceName": "exact_resource_name"
}
```

## Admin UI Structure

### 1. Login Page (`/admin`)
```
┌─────────────────────────────────────┐
│           Kelifax Admin             │
├─────────────────────────────────────┤
│  Username: [________________]       │
│  Password: [________________]       │
│           [Login Button]            │
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
1. **`src/pages/admin.astro`** - Login page
2. **`src/pages/admin/dashboard.astro`** - Main admin dashboard
3. **`src/components/AdminLogin.astro`** - Login form component
4. **`src/components/PendingResourcesList.astro`** - Pending resources management
5. **`src/components/ResourceManager.astro`** - Existing resources management
6. **`src/utils/admin-api.js`** - Admin API utilities
7. **`src/utils/admin-auth.js`** - Authentication utilities

### Backend API Endpoints (Already Implemented)
- ✅ `/admin-auth` - Authentication
- ✅ `/admin-auth/submitted-resources` - Get submitted resources for approval
- ✅ `/admin-auth/approve-resource` - Approve resource
- ✅ `/admin-auth/decline-resource` - Decline resource
- ✅ `/admin-auth/delete-resource` - Delete resource
- ✅ `/get-resource` - Get resource details (POST request)

### Security Considerations
1. **Session Management**: Use secure session tokens with expiration
2. **CORS**: Ensure proper CORS configuration for admin endpoints
3. **Input Validation**: Validate all admin inputs on backend
4. **Rate Limiting**: Implement rate limiting for admin endpoints
5. **Audit Logging**: Log all admin actions for security

### Data Flow
1. **Login**: Cognito Redirect → User Authentication → Authorization Code → Token Exchange → Access/ID Tokens
2. **Load Pending Resources**: Access Token → `/admin-auth/submitted-resources` → Display List
3. **Resource Management**: Access Token → API Request → Database Operation → Response
4. **Resource Transformation**: Resource Name → Lowercase + Hyphenate → Database Query

### Error Handling
- Invalid credentials → Show error message
- Session expired → Redirect to login
- API errors → Show user-friendly error messages
- Network issues → Retry mechanism with user feedback

## Admin Workflow

### Complete Admin Process Flow
1. **Authentication**
   - Admin visits `/admin` page
   - System checks for valid Cognito tokens
   - If not authenticated, redirects to Cognito hosted UI
   - User authenticates with Cognito
   - Authorization code returned to callback URL
   - Frontend exchanges code for access/ID tokens

2. **Dashboard Load**
   - Navigate to admin dashboard with valid Cognito tokens
   - Automatically POST to `/admin-auth/submitted-resources` with Bearer token
   - Display pending resources list
   - Show approve/decline options for each resource

3. **Resource Approval/Decline**
   - Admin selects action on specific resource
   - POST to `/admin-auth/approve-resource` or `/admin-auth/decline-resource`
   - Resource status updated in database
   - UI refreshes to reflect changes

4. **Resource Deletion**
   - Admin searches for existing resource by name
   - POST to `/get-resource` to retrieve resource details
   - Display resource information with delete option
   - POST to `/admin-auth/delete-resource` to remove resource
   - Confirmation of deletion

## Next Steps for Implementation
1. Create admin login page (`/admin`)
2. Implement Cognito authentication redirect
3. Create admin dashboard with pending resources
4. Add approve/decline functionality
5. Implement resource search and delete functionality
6. Add session management and security features
7. Test all admin workflows
8. Deploy and configure backend endpoints

## Technical Notes
- **Resource Processing**: Resource names are processed (lowercase, spaces replaced with hyphens) for database operations
- **Authentication**: All admin actions require valid session authentication via session token
- **Backend Status**: Authentication, resource retrieval, and management endpoints are fully implemented
- **Request Methods**: Most admin operations use POST requests for security and payload transmission
- **Session Management**: Backend handles password verification, session creation, and token validation
- **UI Requirements**: Admin interface should be responsive and user-friendly with clear feedback

## API Summary
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|---------|
| **Cognito Hosted UI** | **GET** | **Admin login authentication** | **🔄 To Configure** |
| `/admin-auth/submitted-resources` | POST | Get pending resources | ✅ Implemented |
| `/admin-auth/approve-resource` | POST | Approve submitted resource | ✅ Implemented |
| `/admin-auth/decline-resource` | POST | Decline submitted resource | ✅ Implemented |
| `/get-resource` | POST | Get resource details | ✅ Implemented |
| `/admin-auth/delete-resource` | POST | Delete existing resource | ✅ Implemented |
