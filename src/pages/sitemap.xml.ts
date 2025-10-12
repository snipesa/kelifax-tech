// sitemap.xml.ts
import type { APIRoute } from 'astro';

const baseUrl = 'https://kelifax.com';

// Import resources data - in production, this would come from your data source
const resourcesData = [
  { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
  { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }
];

export const GET: APIRoute = () => {
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
};
