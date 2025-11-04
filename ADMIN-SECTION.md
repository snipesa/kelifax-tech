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

## Session Management Architecture

### Token Management Strategy
- **Storage Method**: localStorage for cross-tab persistence
- **Token Types**: Access Token (1 hour), ID Token, Refresh Token (30 days)
- **Cross-Tab Sync**: All browser tabs share same authentication state
- **Auto-Refresh**: Expired tokens automatically refreshed using refresh token
- **Session Expiry**: Graceful handling with redirect to login when refresh fails

### Token Storage Structure
```javascript
// localStorage keys for token management (Kelifax-specific naming)
localStorage.setItem('kelifax_cognito_access_token', access_token);     // API authentication
localStorage.setItem('kelifax_cognito_id_token', id_token);             // User profile info
localStorage.setItem('kelifax_cognito_refresh_token', refresh_token);   // Token renewal
localStorage.setItem('kelifax_cognito_expires_at', timestamp);          // Expiration tracking
```

### API Authentication Flow
1. **Token Retrieval**: Get access token from localStorage using `kelifax_cognito_access_token` key
2. **Expiry Check**: Validate token hasn't expired using `kelifax_cognito_expires_at` timestamp
3. **Auto-Refresh**: Use refresh token (`kelifax_cognito_refresh_token`) if access token expired
4. **Header Injection**: Include `Authorization: Bearer {kelifax_cognito_access_token}` in API calls
5. **Error Handling**: Clear session and redirect on 401 unauthorized responses

### Cross-Tab Session Benefits
- **Seamless Experience**: Login once, authenticated across all admin tabs
- **Real-time Sync**: Token updates in one tab reflect in all tabs
- **Unified Logout**: Logout action clears session for all tabs
- **Automatic Recovery**: Tab refresh maintains authentication state

### Session Security Features
- **Token Validation**: API Gateway validates Cognito tokens automatically
- **Automatic Expiry**: Short-lived access tokens (1 hour) for security
- **Secure Refresh**: Long-lived refresh tokens for user convenience
- **XSS Protection**: Input sanitization and validation on token storage
- **Session Cleanup**: Automatic cleanup on authentication failures

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
- **Token Storage**: Tokens stored in localStorage for cross-tab persistence
- **Dashboard Access**: User redirected to admin dashboard with valid tokens

## Admin Dashboard Features

### 1. Pending Resources Management
- **Purpose**: Review and manage submitted resources awaiting approval
- **Data Source**: Retrieved from backend after successful authentication
- **Display**: List of pending resources with basic information
- **Actions**: Approve or Decline each resource



#### Get Submitted Resources (After Authentication)
```javascript
URL: {publicApiUrl}/admin/submitted-resources
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {kelifax_cognito_access_token}"
}
Body: {
  // Cognito access token validates access automatically via API Gateway
}
```

#### Approve Resource
```javascript
URL: {publicApiUrl}/admin/approve-resource
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {kelifax_cognito_access_token}"
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
  "Content-Type": "application/json",
  "Authorization": "Bearer {kelifax_cognito_access_token}"
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
  "Content-Type": "application/json",
  "Authorization": "Bearer {kelifax_cognito_access_token}"
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
7. **`src/utils/admin.js`** - Authentication utilities

### Backend API Endpoints (Already Implemented)
- ✅ `/admin` - Authentication
- ✅ `/admin/submitted-resources` - Get submitted resources for approval
- ✅ `/admin/approve-resource` - Approve resource
- ✅ `/admin/decline-resource` - Decline resource
- ✅ `/admin/delete-resource` - Delete resource
- ✅ `/get-resource` - Get resource details (POST request)

### Security Considerations
1. **Session Management**: Use secure session tokens with expiration
2. **CORS**: Ensure proper CORS configuration for admin endpoints
3. **Input Validation**: Validate all admin inputs on backend
4. **Rate Limiting**: Implement rate limiting for admin endpoints
5. **Audit Logging**: Log all admin actions for security

### Data Flow
1. **Login**: Cognito Redirect → User Authentication → Authorization Code → Token Exchange → Access/ID Tokens
2. **Load Pending Resources**: Access Token → `/admin/submitted-resources` → Display List
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
   - System checks localStorage for valid Cognito tokens
   - If no valid tokens, redirects to Cognito hosted UI for login
   - User completes authentication via Cognito
   - Cognito redirects to callback URL with authorization code
   - Frontend exchanges code for access/ID tokens and stores in localStorage

2. **Dashboard Load**
   - Navigate to admin dashboard with valid Cognito tokens from localStorage
   - Frontend retrieves access token and includes in Authorization header
   - POST to `/admin/submitted-resources` with Authorization header
   - API Gateway validates Cognito token automatically
   - Backend receives validated user context and returns pending resources list
   - Show approve/decline options for each resource

3. **Resource Approval/Decline**
   - Admin selects action on specific resource
   - Frontend gets access token from localStorage (auto-refresh if expired)
   - POST to `/admin/approve-resource` or `/admin/decline-resource` with resourceName in body
   - Include Authorization header with kelifax_cognito_access_token
   - API Gateway validates token, passes user context to Lambda
   - Backend processes action using validated user info and updates database
   - UI refreshes to reflect changes

4. **Resource Deletion**
   - Admin searches for existing resource by name
   - System displays resource information if found
   - Admin confirms deletion action
   - POST to `/admin/delete-resource` with resourceName in body
   - Include Authorization header with kelifax_cognito_access_token
   - API Gateway validates token, Lambda processes deletion with user context
   - Confirmation of deletion with audit logging

5. **Cross-Tab Session Management**
   - All admin tabs share localStorage authentication state
   - Token expiry in one tab triggers automatic refresh across all tabs
   - Logout in one tab clears session for all tabs
   - New tab opening admin page automatically authenticated if valid tokens exist

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

## Session Management Implementation Structure

### Frontend Session Handling
- **Authentication State**: Check localStorage for valid Cognito tokens on page load
- **Token Management**: Automatic refresh of expired access tokens using refresh token
- **Cross-Tab Sync**: All admin tabs share authentication state through localStorage
- **API Integration**: Include `Authorization: Bearer {kelifax_cognito_access_token}` header in all admin requests
- **Error Recovery**: Redirect to login on authentication failures or token expiry

### Backend API Gateway Configuration
- **Cognito User Pool Authorizer**: API Gateway validates Cognito access tokens automatically
- **Token Validation**: No custom authentication logic needed in Lambda functions
- **User Context**: Cognito user information passed to Lambda via event context
- **Automatic Rejection**: Invalid/expired tokens rejected before reaching Lambda
- **Stateless Design**: No server-side session storage required

### Token Lifecycle Management
- **Access Token**: Short-lived (1 hour) for API authentication
- **ID Token**: Contains user profile information for UI display
- **Refresh Token**: Long-lived (30 days) for automatic token renewal
- **Token Storage**: localStorage for cross-tab persistence and user convenience
- **Token Security**: Cryptographically signed by Cognito, validated by API Gateway

### Session Security Architecture
- **Client-Side Storage**: localStorage with input sanitization and validation
- **Server-Side Validation**: API Gateway Cognito authorizer for all admin endpoints  
- **Automatic Expiry**: Short access token lifetime with seamless refresh
- **Cross-Origin Security**: Proper CORS configuration for admin domain
- **Audit Trail**: All admin actions logged with Cognito user context

## API Summary
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|---------|
| **Cognito Hosted UI** | **GET** | **Admin login authentication** | **🔄 To Configure** |
| `/admin/submitted-resources` | POST | Get pending resources | ✅ Implemented |
| `/admin/approve-resource` | POST | Approve submitted resource | ✅ Implemented |
| `/admin/decline-resource` | POST | Decline submitted resource | ✅ Implemented |
| `/get-resource` | POST | Get resource details | ✅ Implemented |
| `/admin/delete-resource` | POST | Delete existing resource | ✅ Implemented |
