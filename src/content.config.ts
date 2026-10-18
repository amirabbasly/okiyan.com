import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    /** Used as the H1 and the <title>. */
    title: z.string(),
    /** Short label for navigation and cards. */
    navTitle: z.string(),
    description: z.string().max(170),
    /** Ordering on the guides index and in the footer. */
    order: z.number(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** The service page this guide primarily supports. */
    relatedService: z.enum(['customs-clearance', 'import-services']),
    /** Other guides to link at the end (by entry id). */
    relatedGuides: z.array(z.string()).default([]),
    summary: z.array(z.string()).min(2).max(5),
    sources: z
      .array(
        z.object({
          title: z.string(),
          publisher: z.string(),
          url: z.url(),
          note: z.string().optional(),
        }),
      )
      .default([]),
    /**
     * Regulatory statements that a qualified person must confirm before launch.
     * Rendered only in non-production builds.
     */
    reviewNotes: z.array(z.string()).default([]),
  }),
});

export const collections = { guides };
