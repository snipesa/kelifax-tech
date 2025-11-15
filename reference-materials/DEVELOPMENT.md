# Kelifax Development Documentation

## 📁 Project Architecture

### Frontend (Astro + Tailwind CSS)
- **Static Site Generation**: Uses Astro for optimal performance and SEO
- **Styling**: Tailwind CSS for consistent, responsive design
- **API Integration**: All data comes from AWS serverless backend (no local data)

### Backend (AWS Serverless)
- **API Gateway**: RESTful API endpoints with CORS support
- **Lambda Functions**: Python-based serverless functions in `/infra/src/lambda/app/`
- **DynamoDB**: NoSQL database for resource data (schema in `DYNAMODB-SCHEMA-RECOMMENDATION.md`)
- **CloudFormation**: Infrastructure as Code in `/infra/cloudformation/`
- **Cognito + Lambda@Edge**: Authentication for admin section

## 🔧 Key Components

### `/src/utils/api.js`
Public API client for resource data:
- Fetches all data from AWS backend
- Error handling and retry logic
- Environment-aware configuration

### `/src/utils/admin-api.js`
Admin API client with cookie-based authentication:
- Resource approval/decline operations
- Admin resource management
- CloudFront Lambda@Edge authentication

### `/src/utils/config.js`
Configuration hub containing:
- API endpoints and settings
- Feature flags and validation rules

### `/src/pages/resource/[slug].astro`
Dynamic resource pages generated from API data:
- Server-side rendering with API integration
- SEO-optimized resource detail pages

## 📋 Documentation References

- **Admin Section**: See `reference-materials/ADMIN-SECTION.md` for authentication flow and admin operations
- **Resource Submission**: See `reference-materials/RESOURCE-SUBMISSION-SPECIFICATION.md` for form structure and validation
- **Database Schema**: See `reference-materials/DYNAMODB-SCHEMA-RECOMMENDATION.md` for DynamoDB table design
- **Deployment**: See `README.md` for deployment commands and setup

## 🔑 Environment Variables

```bash
# Required for API integration
PUBLIC_API_URL=https://dev-api.kelifax.com  # or prod-api.kelifax.com
PUBLIC_API_KEY=your-api-key

# Optional
PUBLIC_CONTACT_EMAIL=contact@kelifax.com
```

## 🏗️ Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (localhost:4321)
npm run build       # Build for production
```

### Adding New API Endpoints
1. Create Lambda function in `/infra/src/lambda/app/`
2. Update CloudFormation template in `/infra/cloudformation/lambda/main.yaml`
3. Update API client in `src/utils/api.js` or `src/utils/admin-api.js`
4. Deploy backend changes

### Adding New Resource Fields
1. Update DynamoDB schema (see `reference-materials/DYNAMODB-SCHEMA-RECOMMENDATION.md`)
2. Update Lambda functions to handle new fields
3. Update UI components to display new fields
4. Update resource submission form (see `reference-materials/RESOURCE-SUBMISSION-SPECIFICATION.md`)

## 🔒 Security & Authentication

- **Public API**: Uses API keys for resource data access
- **Admin API**: JWT authentication via AWS Cognito + CloudFront Lambda@Edge
- **CORS**: Configured in API Gateway for domain restrictions
- **No Local Data**: All data sourced from secure AWS backend

See `reference-materials/ADMIN-SECTION.md` for detailed authentication flow.

## 🔄 Deployment Process

```bash
# Quick deployment commands
./deploy.sh -dev     # Deploy to development
./deploy.sh -prod    # Deploy to production (with confirmation)
```

**Deployment targets:**
- **Dev**: `kelifax-dev-project` S3 bucket
- **Prod**: `kelifax.com-website` S3 bucket

**Backend deployment:**
- Use CloudFormation templates in `/infra/cloudformation/`
- Lambda functions packaged and deployed via SAM
- DynamoDB data uploaded via scripts in `/infra/src/dynamodb/`

## 🏃‍♂️ Performance & Best Practices

- **Static Site Generation**: Fast initial loads with Astro
- **API Integration**: All dynamic data from AWS serverless backend
- **Component Architecture**: Reusable components in `/src/components/`
- **SEO Optimized**: Meta tags, sitemap, structured data
- **Responsive Design**: Mobile-first with Tailwind CSS

## 📁 Project Structure

```
kelifax/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Astro pages and routes
│   ├── utils/             # API clients and utilities
│   └── layouts/           # Page layouts
├── infra/                  # AWS infrastructure
│   ├── src/lambda/         # Lambda function source
│   ├── cloudformation/     # Infrastructure as Code
│   └── src/dynamodb/       # Database scripts and data
├── public/                 # Static assets
├── reference-materials/    # Documentation files
│   ├── DEVELOPMENT.md
│   ├── ADMIN-SECTION.md
│   ├── RESOURCE-SUBMISSION-SPECIFICATION.md
│   └── DYNAMODB-SCHEMA-RECOMMENDATION.md
└── README.md              # Main project documentation
```
