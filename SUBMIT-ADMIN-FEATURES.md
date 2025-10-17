# Kelifax Submit Resource & Admin Features

## Overview
The platform now includes resource submission and admin management features that work with your AWS API Gateway + Lambda + DynamoDB backend.

## Key Features

### 1. Submit Resource Form (`/submit-resource`)
- **Access**: Via "Submit Resource" button in header navigation
- **Fields**: Resource Name, Usage Purpose, URL, Company Email (all required)
- **Validation**: Real-time client-side validation with user feedback
- **API**: Submits to `POST /resources` with JSON format

### 2. Admin Panel (`/admin`)
- **Access**: Manual URL only (hidden from navigation)
- **Authentication**: Password-protected with session management
- **Features**: View submitted resources, approve/reject/delete actions
- **Sign Out**: Available in admin mode

## API Configuration

### Environment Variables (.env)
```bash
PUBLIC_USE_API=false  # Main site uses local JSON, submit/admin uses API
PUBLIC_API_URL=https://af3e78t7db.execute-api.us-east-1.amazonaws.com/dev
PUBLIC_API_KEY=vadegarfgvarfgrfrdfdsafedfsdfdsfsdfdsfsdfdsfsdfdsfsdfdsfsdfdsf
```

### API Endpoints Used
- `POST /resources` - Submit new resource
- `POST /admin-auth` - Admin authentication  
- `GET /resources?status=X` - Get submitted resources (admin)
- `PATCH /resources/{slug}` - Update resource status (admin)
- `DELETE /resources/{slug}` - Delete resource (admin)

### Request Headers
- `X-API-Key: {PUBLIC_API_KEY}` - All requests
- `Authorization: Bearer {token}` - Admin requests only

## JSON Format for Resource Submission
```json
{
  "resourceName": "GitHub",
  "usagePurpose": "Version control and code collaboration",
  "resourceUrl": "https://github.com",
  "companyEmail": "contact@github.com"
}
```

## Development Testing
- **Server**: `http://localhost:4321/`
- **Submit Form**: `http://localhost:4321/submit-resource`
- **Admin Panel**: `http://localhost:4321/admin`
- **Mock Admin Password**: "admin" (for development testing)

## Data Architecture
- **Main Resources**: Local `src/data/resources.json` (fast, SEO-friendly)
- **Submitted Resources**: DynamoDB via API (real-time, scalable)
- **Hybrid Approach**: Best performance + functionality

## Files Modified
- `src/pages/submit-resource.astro` - New submission form
- `src/pages/admin.astro` - New admin panel
- `src/components/Header.astro` - Added submit button
- `src/utils/api.js` - Added submit/admin API functions
- `.env` - API configuration

## Ready for Production
The frontend is fully configured and ready to work with your Lambda functions. All API calls include proper authentication headers and use the exact JSON format specified.
