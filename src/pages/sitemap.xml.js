---
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read resources data
const resourcesPath = join(__dirname, '../data/resources.json');
const resourcesData = JSON.parse(readFileSync(resourcesPath, 'utf-8'));

const baseUrl = 'https://kelifax.com';
const currentDate = new Date().toISOString();

// Static pages
const staticPages = [
  '',
  '/resources',
  '/about',
  '/contact'
];

// Dynamic resource pages
const resourcePages = resourcesData.map(resource => `/resources/${resource.id}`);

// All pages
const allPages = [...staticPages, ...resourcePages];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page === '' ? 'daily' : page.includes('/resources/') ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : page.includes('/resources/') ? '0.8' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;

return new Response(sitemap, {
  headers: {
    'Content-Type': 'application/xml',
  },
});
---
