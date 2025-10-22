# Kelifax - Curated Tech Resources Platform

> A beautiful, responsive platform for discovering the best tech tools and resources, built with Astro and Tailwind CSS.

![Kelifax](https://img.shields.io/badge/Status-Phase%201%20Complete-brightgreen)
![Astro](https://img.shields.io/badge/Built%20with-Astro-orange)
![Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-blue)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:4321/
```

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
│   ├── data/           # Static data (resources.json)
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

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build

aws s3 sync ./dist s3://kelifax-dev-project --delete  #Upload to s3 dev bucket

# Example dev
aws s3 sync ./dist s3://kelifax-dev-project --delete 
# Prod
aws s3 sync ./dist s3://kelifax.com-website --delete 

# DynamoDB Resources Batch Upload
# Dev environment
aws dynamodb batch-write-item --request-items '{"kelifax-SubmittedResources-Dev": '$(cat infra/src/dynamodb/data.json | jq .Resources)'}'

# Prod environment
aws dynamodb batch-write-item --request-items '{"kelifax-resources-prod": '$(cat infra/src/dynamodb/data.json | jq .Resources)'}'

Visit the s3 website URL
```

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

- ✅ **Dynamic JSON Integration** - GitHub resource now uses dynamic data from resources.json
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

**Current Development Mode:**
```env
PUBLIC_USE_API=false
PUBLIC_API_BASE_URL=
```
- Uses static `src/data/resources.json`
- Fast, reliable, no network calls

**Future Production Mode:**
```env
PUBLIC_USE_API=true
PUBLIC_API_BASE_URL=https://your-api-gateway-url
```
- Fetches from API Gateway: `/resources/{id}`
- Falls back to local JSON if API fails

### 📋 **Migration Path**

1. **Current**: All resources from local JSON ✅
2. **Hybrid**: Migrate resources to API one by one
3. **Full API**: All resources served dynamically

**API Contract**: Lambda functions should return the same JSON structure as `resources.json`

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
