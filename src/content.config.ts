import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
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
    relatedService: z.enum(["customs-clearance", "import-services"]),
    /** Other guides to link at the end (by entry id). */
    relatedGuides: z.array(z.string()).default([]),
    /** Customs offices that are relevant to this guide (by entry id). */
    relatedOffices: z.array(z.string()).default([]),
    summary: z.array(z.string()).min(2).max(5),
    /**
     * One-paragraph direct answer to the page's main question, rendered above
     * the body. Answer engines (AI Overviews, ChatGPT Search, Perplexity)
     * quote a self-contained paragraph far more reliably than a long intro.
     */
    answer: z.string().max(600).default(""),
    /** Search intents the page answers; emitted as schema.org `keywords`. */
    keywords: z.array(z.string()).default([]),
    /** Rendered as an FAQ block and as FAQPage structured data. */
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .max(10)
      .default([]),
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

const customs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/customs" }),
  schema: z.object({
    /** Used as the H1 and the <title> (kept short enough for the 60-char SERP limit). */
    title: z.string(),
    /** Short label for listings and breadcrumbs. */
    navTitle: z.string(),
    description: z.string().max(170),
    order: z.number(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** The customs office / port this page is about. */
    office: z.string(),
    city: z.string(),
    /** Terminals, ports or gates handled by this office. */
    terminals: z.array(z.string()).default([]),
    /** Cargo the office is typically used for. */
    cargo: z.array(z.string()).default([]),
    summary: z.array(z.string()).min(2).max(5),
    /**
     * One-paragraph direct answer to the page's main question, rendered above
     * the body. Answer engines (AI Overviews, ChatGPT Search, Perplexity)
     * quote a self-contained paragraph far more reliably than a long intro.
     */
    answer: z.string().max(600).default(""),
    keywords: z.array(z.string()).default([]),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .max(10)
      .default([]),
    relatedGuides: z.array(z.string()).default([]),
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
    reviewNotes: z.array(z.string()).default([]),
  }),
});

export const collections = { guides, customs };
