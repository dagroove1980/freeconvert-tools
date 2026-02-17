import type { MetadataRoute } from 'next';
import { getAllConversions } from '@/lib/conversions';
import { ALL_CATEGORIES } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://free-convert-tool.com';

  const conversions = getAllConversions();

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
  ];

  const categoryPages = ALL_CATEGORIES.map((category) => ({
    url: `${baseUrl}/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const conversionPages = conversions.map((c) => ({
    url: `${baseUrl}/convert/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...conversionPages];
}
