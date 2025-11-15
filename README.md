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

**📚 Architecture & Development:**
- **[Development Guide](./reference-materials/DEVELOPMENT.md)** - Project architecture, API integration, and development workflow
- **[Admin Section](./reference-materials/ADMIN-SECTION.md)** - Authentication flow and admin operations
- **[Resource Submission](./reference-materials/RESOURCE-SUBMISSION-SPECIFICATION.md)** - Form structure and validation rules
- **[Database Schema](./reference-materials/DYNAMODB-SCHEMA-RECOMMENDATION.md)** - DynamoDB table design and optimization

## 🏗️ Project Structure

```
kelifax/
├── src/                    # Frontend source code
│   ├── components/         # UI components
│   ├── layouts/            # Page layouts
│   ├── pages/              # Site pages (auto-routed)
│   ├── utils/              # API utilities and configuration
│   └── styles/             # Global styles
├── infra/                  # AWS infrastructure
│   ├── src/lambda/         # Lambda functions
│   ├── cloudformation/     # Infrastructure as Code
│   └── src/dynamodb/       # Database scripts
├── public/                 # Static assets
├── reference-materials/    # 📚 Documentation
└── README.md              # Main project guide
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


### **🚀 Frontend Deployment**
```bash
# Deploy to development environment
./deploy.sh -dev

# Deploy to production environment (with confirmation)
./deploy.sh -prod
```

### **🔧 Backend Infrastructure Deployment**
```bash
# Lambda Edge Authentication (Cognito)
cd infra/src/cognito-lambda-edge
./package-lambda-edge.sh dev    # Package for development
./package-lambda-edge.sh prod   # Package for production

# Lambda Authorizer
cd infra/src/lambda-authorizer
./package-authorizer.sh dev     # Package for development
./package-authorizer.sh prod    # Package for production

# DynamoDB Resources Management
cd infra/src/dynamodb
./upload-resources.sh dev data.json   # Upload to development
./upload-resources.sh prod data.json  # Upload to production
```

### **Environment Files**
- `.env` - Local development (not committed to git)
- `.env.dev.config` - Development deployment config
- `.env.prod.config` - Production deployment config

## 🌟 Recent Updates - SEO & Navigation Enhancements

### ✅ **Phase 2b Complete - SEO-Optimized URLs**
- **SEO-Friendly URLs**: Changed from `/resources/1` to `/resources/visual-studio-code`
- **Meta Tags**: Comprehensive keywords, Open Graph, Twitter Cards, canonical URLs


### ✅ **Homepage & Core Functionality**
- **All Components Working**: ResourceCard components properly configured with slug props
- **Error-Free Loading**: Resolved all 404 errors and missing asset issues
- **Cross-Page Consistency**: Slug-based links working across all pages and components
- **Mobile Responsive**: Full functionality across all device sizes


## 🚀 Additional Deployment Options

```bash
# Frontend deployment with options
./deploy.sh -dev --dry-run         # Build for dev but don't deploy
./deploy.sh -prod --dry-run        # Build for prod but don't deploy
./deploy.sh --help                 # Show usage information
```

## 📞 Support

For detailed guidance, see the [Complete Project Guide](reference-materials/DEVELOPMENT.md) which covers everything from basic customization to advanced API integration.

---

**Built with ❤️ using [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)**
