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

Visit the s3 website URL
```

## 🌟 What's Next (Phase 2)

- Backend integration with AWS Lambda
- User accounts and authentication
- Resource bookmarking and favorites
- Admin dashboard for resource management
- Analytics and performance tracking

## 📞 Support

For detailed guidance, see the [Complete Project Guide](./KELIFAX-GUIDE.md) which covers everything from basic customization to advanced API integration.

---

**Built with ❤️ using [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)**
