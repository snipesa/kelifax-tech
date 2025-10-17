# Hybrid API Configuration - Kelifax

## Overview

The Kelifax platform uses a **hybrid approach** for data management:

- **Main Resources**: Served from local `src/data/resources.json` file
- **Submit & Admin Features**: Use real API Gateway + Lambda + DynamoDB

## Configuration

### Environment Variables (.env)
```bash
# Main resources from local JSON, Submit/Admin features use real API  
PUBLIC_USE_API=false
PUBLIC_API_URL=https://af3e78t7db.execute-api.us-east-1.amazonaws.com/dev
PUBLIC_API_KEY=vadegarfgvarfgrfrdfdsafedfsdfdsfsdfdsfsdfdsfsdfdsfsdfdsfsdfdsf
```

### API Usage Pattern

| Feature | Data Source | API Used |
|---------|-------------|----------|
| Homepage Resources | Local JSON | ❌ None |
| Resources Listing | Local JSON | ❌ None |
| Resource Details | Local JSON | ❌ None |
| **Submit Resource** | **DynamoDB** | ✅ **Real API** |
| **Admin Authentication** | **Lambda** | ✅ **Real API** |
| **Admin View Submitted** | **DynamoDB** | ✅ **Real API** |
| **Admin Approve/Reject** | **DynamoDB** | ✅ **Real API** |

## API Endpoints Used

Only these endpoints are actively called:

### Submit Resource
- **Endpoint**: `POST /resources`
- **Purpose**: Submit new resource to DynamoDB
- **Data**: JSON with resourceName, usagePurpose, resourceUrl, companyEmail

### Admin Authentication  
- **Endpoint**: `POST /admin-auth`
- **Purpose**: Authenticate admin user
- **Data**: JSON with password
- **Returns**: JWT token for subsequent admin requests

### Admin Get Submitted Resources
- **Endpoint**: `GET /resources?status=submitted` (with auth header)
- **Purpose**: Fetch submitted resources from DynamoDB
- **Auth**: Bearer token required

### Admin Update Status
- **Endpoint**: `PATCH /resources/{slug}` (with auth header)  
- **Purpose**: Approve/reject submitted resources
- **Data**: JSON with status (approved/rejected)

### Admin Delete Resource
- **Endpoint**: `DELETE /resources/{slug}` (with auth header)
- **Purpose**: Delete submitted resource from DynamoDB

## API Key Usage

The `PUBLIC_API_KEY` is included in all API requests via the `X-API-Key` header for authentication with API Gateway.

## Mock Data for Development

Mock data is still available for development testing:
- **Admin Login**: Use password "admin" for mock authentication
- **Mock Resources**: Predefined submitted resources for testing admin panel
- **Mock Responses**: Admin actions return success messages when using mock token

## Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main Site     │    │  Submit Resource │    │  Admin Panel    │
│  (Local JSON)   │    │   (Real API)     │    │  (Real API)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ resources.json  │    │  API Gateway     │    │  API Gateway    │
│                 │    │       +          │    │       +         │
│ Static content  │    │  Lambda + DDB    │    │  Lambda + DDB   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Benefits of This Approach

1. **Performance**: Main site loads instantly from local JSON
2. **SEO**: Static resources are crawlable and fast
3. **Scalability**: Submit/admin features scale with serverless
4. **Cost**: Most traffic served statically, minimal API costs
5. **Reliability**: Main site works even if API is down

## Migration Path

Future migration to full API:
1. Set `PUBLIC_USE_API=true`
2. Update main resource components to use `getResources()`
3. Populate DynamoDB with approved resources
4. Remove local JSON dependency

## Implementation Notes

- `getResources()` function handles both local and API modes
- Admin functions always use real API regardless of `PUBLIC_USE_API` setting
- Mock responses available for development/testing
- API key automatically included in all requests
- Proper error handling for API failures
