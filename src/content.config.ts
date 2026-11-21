import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    /** Used as the H1 and in listings. */
    title: z.string(),
    /**
     * Optional shorter variant used ONLY in <title>. Needed when the display
     * title would push the SERP title past ~60 characters: the H1 and every
     * listing keep the full title, so no page content changes.
     */
    seoTitle: z.string().max(70).optional(),
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
    /** Origin-country pages that are relevant to this guide (by entry id). */
    relatedOrigins: z.array(z.string()).default([]),
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
    /** Origin-country pages relevant to this office (by entry id). */
    relatedOrigins: z.array(z.string()).default([]),
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

/**
 * Country / corridor pages: «واردات از چین»، «واردات از دبی»، «واردات از ترکیه».
 * Each page answers a commercial-intent query about one origin country
 * (route, documents, Incoterms, risks) rather than repeating general customs rules.
 */
const origins = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/origins" }),
  schema: z.object({
    title: z.string(),
    navTitle: z.string(),
    description: z.string().max(170),
    order: z.number(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Origin country / market shown in the hero and the cards. */
    country: z.string(),
    /** Main freight corridors used from this origin. */
    corridors: z.array(z.string()).default([]),
    /** Cargo that is typically imported from here. */
    goods: z.array(z.string()).default([]),
    summary: z.array(z.string()).min(2).max(5),
    answer: z.string().max(600).default(""),
    keywords: z.array(z.string()).default([]),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .max(10)
      .default([]),
    relatedGuides: z.array(z.string()).default([]),
    relatedOffices: z.array(z.string()).default([]),
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

/**
 * Commodity pages: «واردات برنج»، «ترخیص قطعات خودرو»، «واردات ماشین‌آلات صنعتی».
 *
 * Each page answers a transactional/commercial query about ONE kind of cargo:
 * which tariff headings it usually falls under, which device licences it needs,
 * what the clearance path looks like and where files of this type get stuck.
 *
 * Hard rule for this collection: no rate, price, percentage or deadline is
 * stated as fact unless it is a stable, citable rule of the HS nomenclature or
 * of a named law. Anything that a yearly amendment can change is described as a
 * *mechanism* (who decides it, where it is published) and left to the visitor's
 * own file — see /hs-code/ and /customs-exchange-rate/.
 */
const goods = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/goods" }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(70).optional(),
    navTitle: z.string(),
    description: z.string().max(170),
    order: z.number(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** The commodity itself, shown as the card eyebrow («برنج», «قطعات خودرو»). */
    product: z.string(),
    /** Search intent this page is written for; drives the hub grouping. */
    intent: z.enum(["transactional", "commercial"]).default("transactional"),
    /**
     * Tariff headings this commodity usually falls under. Codes are the
     * international HS heading (4 digits) — stable across editions — never an
     * 8-digit national line, which changes with each year's book.
     */
    hs: z.array(z.object({ code: z.string(), label: z.string() })).default([]),
    /** Device licences / permits this cargo typically needs, as plain statements. */
    permits: z.array(z.string()).default([]),
    /** Cost components that are specific to this cargo (not general clearance). */
    costDrivers: z.array(z.string()).default([]),
    /** Origin-country pages relevant here (entry ids of the `origins` collection). */
    relatedOrigins: z.array(z.string()).default([]),
    /** Customs offices this cargo usually enters through (entry ids). */
    relatedOffices: z.array(z.string()).default([]),
    relatedGuides: z.array(z.string()).default([]),
    summary: z.array(z.string()).min(2).max(5),
    answer: z.string().max(600).default(""),
    keywords: z.array(z.string()).default([]),
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
    reviewNotes: z.array(z.string()).default([]),
  }),
});

export const collections = { guides, customs, origins, goods };
