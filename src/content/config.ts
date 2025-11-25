import { defineCollection, z } from 'astro:content';

const insights = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    author: z.string().default('Kelifax Team'),
    readingTime: z.string(),
    coverImage: z.string().optional(),
    relatedResources: z.array(z.string()).default([]),
    seoKeywords: z.array(z.string()).default([]),
  }),
});

export const collections = {
  insights,
};
