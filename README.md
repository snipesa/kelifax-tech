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
- ✅ **SEO Optimized** (meta tags, sitemap, robots.txt)
- ✅ **Component Architecture** (reusable UI components)
- ✅ **Resource Management** (cards, details, filtering)
- ✅ **Search Functionality** (frontend ready)
- ✅ **Newsletter Signup** (UI complete)
- ✅ **Contact Forms** (validation ready)

## 📖 Documentation

**📚 [Complete Project Guide](./KELIFAX-GUIDE.md)** - Comprehensive documentation covering:
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
└── KELIFAX-GUIDE.md    # 📚 Complete documentation
```

## 🎯 Current Pages

- **Homepage** (`/`) - Hero, featured resources, categories
- **Resources** (`/resources`) - Filterable resource grid  
- **Resource Details** (`/resources/[id]`) - Individual resource pages
- **About** (`/about`) - Company information
- **Contact** (`/contact`) - Contact form

## 🔧 Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build

aws s3 sync ./dist s3://kelifax-dev-project --delete  #Upload to s3 dev bucket

# Example dev
aws s3 sync ./dist s3://kelifax-dev-project
# Prod
aws s3 sync ./dist s3://kelifax.com-website

Visit the s3 website URL
```

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

## 🌟 What's Next (Phase 2b)

- Backend integration with AWS Lambda
- User accounts and authentication
- Resource bookmarking and favorites
- Admin dashboard for resource management
- Analytics and performance tracking
- Enhanced resource pages for other tools (VS Code, Figma, etc.)

### Resource Logo Images
- Store all resource logo images in `public/logos/`.
- Recommended size: **128x128 pixels**.
- Use **PNG** (with transparency) or **SVG** formats.
- Keep file size under **50 KB** for optimal performance.

## 📞 Support

For detailed guidance, see the [Complete Project Guide](./KELIFAX-GUIDE.md) which covers everything from basic customization to advanced API integration.

---

**Built with ❤️ using [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)**
