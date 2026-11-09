/**
 * Structured data builders. Everything emitted here must match visible,
 * verified page content — no ratings, reviews, or unconfirmed facts.
 */
import { site, socialLinks } from "~/config/site";
import { absoluteUrl } from "./url";

export interface Crumb {
  name: string;
  path: string;
}

export function organizationLd(base: URL | undefined) {
  const c = site.contact;
  const org: Record<string, unknown> = {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization", base),
    name: site.name,
    alternateName: site.nameLatin,
    url: absoluteUrl("/", base),
    logo: absoluteUrl("/logo.png", base),
    description: site.description,
  };
  if (site.company.legalName) org.legalName = site.company.legalName;
  if (site.company.foundingYear)
    org.foundingDate = String(site.company.foundingYear);
  if (c.email) org.email = c.email;
  if (c.phone) org.telephone = c.phone;
  if (c.address) {
    org.address = {
      "@type": "PostalAddress",
      addressCountry: "IR",
      ...c.address,
    };
  }
  if (c.phone || c.email) {
    org.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["fa"],
      ...(c.phone ? { telephone: c.phone } : {}),
      ...(c.email ? { email: c.email } : {}),
    };
  }
  const same = socialLinks().map((s) => s.href);
  if (same.length) org.sameAs = same;
  return org;
}

export function websiteLd(base: URL | undefined) {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website", base),
    name: site.name,
    url: absoluteUrl("/", base),
    inLanguage: "fa-IR",
    publisher: { "@id": absoluteUrl("/#organization", base) },
  };
}

export function breadcrumbLd(crumbs: Crumb[], base: URL | undefined) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path, base),
    })),
  };
}

/** FAQPage for a page whose questions are visible on it (no invented Q&A). */
export function faqLd(
  items: Array<{ q: string; a: string }>,
  path: string,
  base: URL | undefined,
) {
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    "@id": absoluteUrl(`${path}#faq`, base),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function serviceLd(
  opts: {
    name: string;
    description: string;
    path: string;
    serviceType: string;
  },
  base: URL | undefined,
) {
  return {
    "@type": "Service",
    "@id": absoluteUrl(`${opts.path}#service`, base),
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    url: absoluteUrl(opts.path, base),
    areaServed: { "@type": "Country", name: "Iran" },
    provider: { "@id": absoluteUrl("/#organization", base) },
    inLanguage: "fa-IR",
  };
}

export function articleLd(
  opts: {
    title: string;
    description: string;
    path: string;
    published: Date;
    modified?: Date;
    image?: string;
    /** Search intents the page answers (schema.org `keywords`). */
    keywords?: string[];
    /** Top-level section, e.g. «ترخیص کالا». */
    section?: string;
  },
  base: URL | undefined,
) {
  return {
    "@type": "Article",
    "@id": absoluteUrl(`${opts.path}#article`, base),
    headline: opts.title,
    description: opts.description,
    inLanguage: "fa-IR",
    mainEntityOfPage: absoluteUrl(opts.path, base),
    datePublished: opts.published.toISOString(),
    dateModified: (opts.modified ?? opts.published).toISOString(),
    image: absoluteUrl(opts.image ?? "/og/default.png", base),
    ...(opts.keywords && opts.keywords.length
      ? { keywords: opts.keywords.join("، ") }
      : {}),
    ...(opts.section ? { articleSection: opts.section } : {}),
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: site.name,
      url: absoluteUrl("/", base),
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png", base) },
    },
  };
}
