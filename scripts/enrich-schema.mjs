// Injects Article + BreadcrumbList JSON-LD into every interpretation page.
// Idempotent: re-running replaces existing enriched block.
// Run standalone or chained after wire-up.mjs.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const PILLARS = ["dream", "symbol", "number"];

const SITE = "https://psysymbol.com";
const TODAY = new Date().toISOString().slice(0, 10);
const PUBLISHED = "2026-05-18"; // Initial corpus publication date.

const PILLAR_LABEL = { dream: "Dreams", symbol: "Symbols", number: "Numbers" };

const MARKER_START = "<!-- schema:article-breadcrumb -->";
const MARKER_END = "<!-- /schema:article-breadcrumb -->";

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function buildSchemaBlock({ title, description, canonical, pillar, slug, image }) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    image: image ? [image] : undefined,
    datePublished: PUBLISHED,
    dateModified: TODAY,
    inLanguage: "en-GB",
    author: { "@type": "Organization", name: "PsySymbol", url: SITE + "/" },
    publisher: {
      "@type": "Organization",
      name: "PsySymbol",
      url: SITE + "/",
      logo: { "@type": "ImageObject", url: SITE + "/favicon.svg" },
    },
    articleSection: PILLAR_LABEL[pillar],
    keywords: [pillar, slug.replace(/-/g, " "), `${pillar} meaning`, `${pillar} interpretation`].join(", "),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: PILLAR_LABEL[pillar], item: `${SITE}/${pillar}/` },
      { "@type": "ListItem", position: 3, name: title.split(" — ")[0] || title, item: canonical },
    ],
  };

  return [
    MARKER_START,
    `<script type="application/ld+json">${JSON.stringify(article)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`,
    MARKER_END,
  ].join("\n");
}

function enrichFile(filePath, pillar, slug) {
  let html = readFileSync(filePath, "utf8");

  const title = extract(html, /<title>([^<]+)<\/title>/i);
  const description = extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const canonical = extract(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    || `${SITE}/${pillar}/${slug}.html`;
  const image = extract(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

  if (!title || !description) {
    console.warn(`  ⚠ skipping ${pillar}/${slug}.html — missing title or description`);
    return false;
  }

  const block = buildSchemaBlock({ title, description, canonical, pillar, slug, image });

  // Idempotent replace if marker exists; else insert before </head>.
  const markerRe = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`);
  if (markerRe.test(html)) {
    html = html.replace(markerRe, block);
  } else {
    html = html.replace(/<\/head>/i, `${block}\n</head>`);
  }

  writeFileSync(filePath, html, "utf8");
  return true;
}

let enriched = 0;
let skipped = 0;
for (const pillar of PILLARS) {
  const dir = resolve(DIST, pillar);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith(".html") && f !== "index.html");
  for (const f of files) {
    const slug = f.replace(/\.html$/, "");
    const ok = enrichFile(resolve(dir, f), pillar, slug);
    if (ok) enriched++; else skipped++;
  }
}

console.log(`Schema enrichment: ${enriched} pages enriched, ${skipped} skipped.`);
