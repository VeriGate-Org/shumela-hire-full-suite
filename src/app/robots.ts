import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/login', '/settings', '/profile', '/api/'],
      },
    ],
    sitemap: 'https://shumelahire.co.za/sitemap.xml',
  };
}
