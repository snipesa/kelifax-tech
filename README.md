# Kelifax - Curated Tech Resources Platform

> A beautiful, responsive platform for discovering the best tech tools and resources, built with Astro and Tailwind CSS.

![Kelifax](https://img.shields.io/badge/Status-Phase%201%20Complete-brightgreen)
![Astro](https://img.shields.io/badge/Built%20with-Astro-orange)
![Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-blue)

## 🚀 Quick Start

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:4321/
```

### **Quick Deployment**
```bash
# Deploy to development
./deploy.sh -dev

# Deploy to production (with confirmation)
./deploy.sh -prod
```

**Prerequisites for deployment:**
- AWS CLI installed and configured
- Access to S3 buckets: `kelifax-dev-project` (dev) and `kelifax.com-website` (prod)

## 📋 Features

- ✅ **Static Site Generation** with Astro
- ✅ **Responsive Design** with Tailwind CSS  
- ✅ **SEO Optimized** (meta tags, sitemap, robots.txt, structured data)
- ✅ **Component Architecture** (reusable UI components)
- ✅ **Resource Management** (cards, details, filtering)
- ✅ **Search Functionality** (frontend ready)
- ✅ **Newsletter Signup** (UI complete)
- ✅ **Contact Forms** (validation ready)
- ✅ **SEO-Friendly URLs** (slug-based routing: `/resources/github`)
- ✅ **Active Navigation** (highlighted tabs, interactive dropdowns)
- ✅ **Enhanced Resource Data** (key features, use cases, learning resources)

## 📖 Documentation

**📚 [Complete Project Guide](./kelifax-guide.md)** - Comprehensive documentation covering:
- Project structure and file organization
- Component architecture and customization
- SEO implementation and best practices
- API integration points for Phase 2
- Development workflows and deployment

## 🏗️ Project Structure

```
kelifax/
├── src/
│   ├── components/     # UI components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Site pages (auto-routed)
│   ├── utils/          # API utilities and configuration
│   └── styles/         # Global styles
├── public/             # Static assets
└── kelifax-guide.md    # 📚 Complete documentation
```

## 🎯 Current Pages

- **Homepage** (`/`) - Hero, featured resources, categories
- **Resources** (`/resources`) - Filterable resource grid  
- **Resource Details** (`/resources/[slug]`) - SEO-friendly individual resource pages (e.g., `/resources/github`, `/resources/visual-studio-code`)
- **About** (`/about`) - Company information
- **Contact** (`/contact`) - Contact form

## 🔧 Development Commands

### **Local Development**
```bash
npm install      # Install dependencies
npm run dev      # Start development server (http://localhost:4321)
npm run build    # Build for production  
npm run preview  # Preview production build locally
```

### **Environment Configuration**
```bash
# Development environment (uses .env.development)
# - API: https://ds7z6al08j.execute-api.us-east-1.amazonaws.com/dev
# - S3: kelifax-dev-project

# Production environment (uses .env.production)  
# - API: https://ru8vee8krh.execute-api.us-east-1.amazonaws.com/prod
# - S3: kelifax.com-website
```

### **🚀 Automated Deployment**
```bash
# Deploy to development environment
./deploy.sh -dev

# Deploy to production environment (with confirmation)
./deploy.sh -prod

# Show deployment help
./deploy.sh -h
```

**What the deployment script does:**
- ✅ Switches to correct environment configuration
- ✅ Builds project with proper API URLs
- ✅ Deploys to appropriate S3 bucket
- ✅ Auto-detects and invalidates CloudFront CDN
- ✅ Restores original .env after deployment
- ✅ Comprehensive error handling and rollback

### **Manual Deployment (if needed)**
```bash
# Development
cp .env.development .env
npm run build
aws s3 sync ./dist s3://kelifax-dev-project --delete

# Production
cp .env.production .env
npm run build
aws s3 sync ./dist s3://kelifax.com-website --delete
```

### **DynamoDB Resources Management**
```bash
# Upload enhanced resource data to DynamoDB

# For Dev environment
cd infra/src/dynamodb
./upload-resources.sh dev data.json

# For Prod environment  
cd infra/src/dynamodb
./upload-resources.sh prod data.json
```

### **Environment Files**
- `.env` - Local development (not committed to git)
- `.env.development` - Development deployment config
- `.env.production` - Production deployment config

## 🌟 Recent Updates - SEO & Navigation Enhancements

### ✅ **Phase 2b Complete - SEO-Optimized URLs**
- **SEO-Friendly URLs**: Changed from `/resources/1` to `/resources/visual-studio-code`
- **Enhanced Navigation**: Active tab highlighting with Alpine.js interactive dropdowns
- **Slug-Based Routing**: All resource pages now use descriptive slugs for better SEO
- **Updated Sitemap**: Dynamic sitemap generation with slug-based URLs
- **Resource Data Enhancement**: Added slug fields to all resources in JSON data

### ✅ **Advanced SEO Implementation**
- **Meta Tags**: Comprehensive keywords, Open Graph, Twitter Cards, canonical URLs
- **Structured Data**: JSON-LD markup for rich snippets and better search engine understanding
- **Performance**: Homepage loads in ~11ms, resource pages in ~4ms
- **Navigation**: Interactive dropdowns with proper accessibility and mobile support
- **URL Structure**: SEO-optimized slugs using kebab-case format (e.g., `visual-studio-code`)

### ✅ **Homepage & Core Functionality**
- **All Components Working**: ResourceCard components properly configured with slug props
- **Error-Free Loading**: Resolved all 404 errors and missing asset issues
- **Cross-Page Consistency**: Slug-based links working across all pages and components
- **Mobile Responsive**: Full functionality across all device sizes

## 🌟 Phase 2a Complete - Enhanced GitHub Resource

- ✅ **Dynamic API Integration** - GitHub resource now uses dynamic data from API
- ✅ **Enhanced Resource Data** - Added keyFeatures, useCases, and learningResources
- ✅ **Dedicated GitHub Page** - Comprehensive page showcasing Git, GitHub Actions, and GitHub Copilot
- ✅ **Improved ResourceCard** - Enhanced to display key features and additional metadata
- ✅ **Scalable Architecture** - Code structure ready for easy addition of more enhanced resources

## 🚀 Future-Compatible API Architecture

### ✅ **API-Ready Implementation Complete**

The codebase has been restructured to seamlessly support both **static JSON** (current) and **API Gateway + Lambda** (future) without any code changes:

- **Environment-Based Switching**: Uses `PUBLIC_USE_API` environment variable
- **Graceful Fallback**: API failures automatically fall back to local JSON
- **Zero Breaking Changes**: All existing functionality preserved
- **Promise-Based Architecture**: All data functions now async-ready

### 🔧 **How It Works**

**Current Production Mode:**
```env
PUBLIC_USE_API=true
PUBLIC_API_BASE_URL=https://your-api-gateway-url
```
- All resources fetched from API Gateway
- Static generation uses API data during build
- Dynamic enhancement loads detailed data at runtime

### 📋 **API-First Architecture**

1. **Static Generation**: Uses API data to generate pages at build time ✅
2. **Runtime Enhancement**: Loads detailed resource data dynamically ✅  
3. **Full Integration**: All data comes from DynamoDB via Lambda functions ✅

**API Contract**: Lambda functions return structured JSON data for all resource information

## 🌟 What's Next (Phase 3)

- Backend integration with AWS Lambda and API Gateway
- User accounts and authentication system  
- Resource bookmarking and favorites functionality
- Admin dashboard for resource management
- Analytics and performance tracking
- Enhanced resource pages for other tools (VS Code, Figma, etc.)
- Search functionality with filtering and sorting
- User-generated content and reviews

### 🎨 Asset Management
- **Resource Logo Images**: Store in `public/logos/` (128x128px, PNG/SVG, <50KB)
- **Missing Logos**: Tailwind CSS and Postman logos can be added for visual completeness
- **Image Optimization**: Consider implementing lazy loading for better performance

## 📞 Support

For detailed guidance, see the [Complete Project Guide](./kelifax-guide.md) which covers everything from basic customization to advanced API integration.

---

**Built with ❤️ using [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)**
