# Kelifax Development Documentation

## 📁 Project Architecture

### Frontend (Astro + Tailwind CSS)
- **Static Site Generation**: Uses Astro for optimal performance and SEO
- **Styling**: Tailwind CSS for consistent, responsive design
- **Enhanced UX**: Client-side API integration for dynamic content

### Backend (AWS Serverless)
- **API Gateway**: RESTful API endpoints with CORS support
- **Lambda Functions**: Python-based serverless functions
- **DynamoDB**: NoSQL database for enhanced resource data
- **CloudFormation**: Infrastructure as Code for deployment

## 🔧 Key Components

### `/src/utils/api.js`
Centralized API client with:
- Proper error handling and logging
- Configurable headers (including API key)
- Retry logic for failed requests
- Environment-aware debugging

### `/src/utils/config.js`
Configuration hub containing:
- API endpoints and settings
- Application constants
- Feature flags
- Validation rules

### `/src/pages/resources/[slug].astro`
Dynamic resource pages with:
- Static generation for performance
- Client-side enhancement via API
- Graceful fallback to local data
- Loading indicators and error handling

## 🚀 API Integration Flow

1. **Static Build**: Astro generates pages using local `resources.json`
2. **Runtime Enhancement**: JavaScript fetches enhanced data from API
3. **Dynamic Updates**: Page content updated with key features, use cases, learning resources
4. **Error Handling**: Graceful fallback if API unavailable

## 🔑 Environment Variables

```bash
# Required for API integration
PUBLIC_API_URL=https://your-api-gateway-url/stage
PUBLIC_API_KEY=your-api-key

# Optional
PUBLIC_CONTACT_EMAIL=contact@yoursite.com
```

## 🧪 Development Guidelines

### Adding New API Endpoints
1. Update `src/utils/api.js` with new function
2. Add proper JSDoc documentation
3. Include error handling
4. Test with both success and failure scenarios

### Adding New Resource Fields
1. Update `src/data/resources.json` for static data
2. Update DynamoDB schema if enhanced data needed
3. Update UI components to display new fields
4. Test API integration

### Feature Flags
Use `src/utils/config.js` FEATURES object to control:
- Beta features
- Development-only functionality
- API-dependent features

## 🔒 Security Notes

- API keys are handled client-side (public environment variables)
- CORS is configured in API Gateway on Lambda for domain restrictions
- No sensitive data in client-side code
- Admin functions require server-side authentication

## 📈 Performance Optimizations

- Static site generation for fast initial loads
- Progressive enhancement with API data
- Optimized images and assets
- CDN distribution via CloudFront

## 🚨 Error Handling Strategy

1. **API Failures**: Graceful fallback to local data
2. **Network Issues**: Retry logic with exponential backoff
3. **User Feedback**: Loading indicators and error messages
4. **Development**: Enhanced logging when in dev mode

## 🔄 Deployment Process

1. **Frontend**: Build with `npm run build` → Deploy to S3 → Invalidate CloudFront
2. **Backend**: Use CloudFormation or SAM for Lambda deployment
3. **Database**: Upload resource data to DynamoDB as needed

## 📝 Code Quality

- ESLint for JavaScript linting
- Prettier for code formatting
- JSDoc comments for functions
- Descriptive commit messages
- Clean, modular architecture
