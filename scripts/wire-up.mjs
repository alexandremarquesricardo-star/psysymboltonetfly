// Post-pipeline wire-up: rebuilds sitemap, hub pages, SPA topics surface, and bumps SW cache.
// Run after generate-content.mjs completes.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const PILLARS = ["dream", "symbol", "number"];
const TODAY = new Date().toISOString().slice(0, 10);

// Slug → display name mapping for the SPA topics surface.
const DISPLAY_OVERRIDES = {
  "being-chased": "Being chased",
  "teeth-falling-out": "Teeth falling out",
  "ex-partner": "Dreaming of an ex",
  "black-cat": "Black cat",
  "tree-of-life": "Tree of Life",
  "yin-yang": "Yin Yang",
  "eye-of-horus": "Eye of Horus",
  "eye-of-providence": "Eye of Providence",
  "star-of-david": "Star of David",
  "celtic-cross": "Celtic cross",
  "celtic-knot": "Celtic knot",
  "trinity-knot": "Trinity knot",
  "all-seeing-eye": "All-seeing eye",
  "third-eye": "Third eye",
  "evil-eye": "Evil eye",
  "north-star": "North Star",
  "shooting-star": "Shooting star",
  "broken-clock": "Broken clock",
  "snake-shedding": "Snake shedding skin",
  "feather-white": "White feather",
  "feather-black": "Black feather",
  "rose-red": "Red rose",
  "rose-white": "White rose",
  "rose-black": "Black rose",
  "tree-of-life": "Tree of Life",
  "lotus-flower": "Lotus flower",
  "sun-and-moon": "Sun and Moon",
  "key-and-lock": "Key and Lock",
  "stairs-symbol": "Stairs",
  "spider-symbol": "Spider symbol",
  "water-symbol": "Water element",
  "blood-symbol": "Blood (symbol)",
  "snake-biting": "Snake biting you",
  "snake-attacking": "Snake attacking",
  "snake-many": "Many snakes",
  "purple-snake": "Purple snake",
  "white-snake": "White snake",
  "yellow-snake": "Yellow snake",
  "green-snake": "Green snake",
  "red-snake": "Red snake",
  "black-snake": "Black snake",
  "car-accident": "Car accident",
  "being-late": "Being late",
  "naked-in-public": "Naked in public",
  "losing-keys": "Losing keys",
  "lost-wallet": "Losing your wallet",
  "dead-person-alive": "Dead person alive",
  "house-on-fire": "House on fire",
  "dead-grandmother": "Deceased grandmother",
  "dead-grandfather": "Deceased grandfather",
  "wedding-ring": "Wedding ring",
  "engagement-ring": "Engagement ring",
  "ex-husband": "Ex-husband",
  "ex-wife": "Ex-wife",
  "old-friend": "Old friend",
  "missing-flight": "Missing your flight",
  "broken-mirror": "Broken mirror",
  "haunted-house": "Haunted house",
  "secret-room": "Secret room",
  "old-house": "Old house",
  "butterfly-flying": "Butterfly flying",
  "money-found": "Finding money",
  "1010-alt": "1011",
  "1144-alt": "1313 (alt reading)",
};

function displayName(slug) {
  if (DISPLAY_OVERRIDES[slug]) return DISPLAY_OVERRIDES[slug];
  // Capitalize first letter of each word, replace hyphens with spaces
  return slug
    .split("-")
    .map((w) => (w.match(/^\d+$/) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function readSlugs(pillar) {
  const dir = resolve(DIST, pillar);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html") && f !== "index.html")
    .map((f) => f.replace(/\.html$/, ""))
    .sort((a, b) => {
      // Numeric sort for number pillar; otherwise alphabetical
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    });
}

const corpus = Object.fromEntries(PILLARS.map((p) => [p, readSlugs(p)]));
const totalPages =
  corpus.dream.length + corpus.symbol.length + corpus.number.length;

console.log(`Corpus: dream=${corpus.dream.length} symbol=${corpus.symbol.length} number=${corpus.number.length} total=${totalPages}`);

// ---------- 1. sitemap.xml ----------
const sitemapLines = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  `  <url><loc>https://psysymbol.com/</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
];
for (const pillar of PILLARS) {
  sitemapLines.push(
    `  <url><loc>https://psysymbol.com/${pillar}/</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
  );
  for (const slug of corpus[pillar]) {
    sitemapLines.push(
      `  <url><loc>https://psysymbol.com/${pillar}/${slug}.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    );
  }
}
for (const page of ["about", "methodology", "privacy", "terms", "contact"]) {
  sitemapLines.push(
    `  <url><loc>https://psysymbol.com/${page}.html</loc><lastmod>${TODAY}</lastmod><changefreq>yearly</changefreq><priority>${page === "contact" ? "0.3" : "0.4"}</priority></url>`
  );
}
sitemapLines.push(`</urlset>`, "");
writeFileSync(resolve(DIST, "sitemap.xml"), sitemapLines.join("\n"), "utf8");
console.log("  ✓ sitemap.xml");

// ---------- 2. SPA topics surface ----------
const indexPath = resolve(DIST, "index.html");
let spaHtml = readFileSync(indexPath, "utf8");

function buildPillarColumn(pillar, label) {
  const items = corpus[pillar]
    .map((slug) => `        <li><a href="/${pillar}/${slug}.html">${displayName(slug)}</a></li>`)
    .join("\n");
  return `    <div class="topics__col">
      <h3><a href="/${pillar}/">${label}</a></h3>
      <ul>
${items}
      </ul>
    </div>`;
}

const newGrid = `  <div class="topics__grid">
${buildPillarColumn("dream", "Dreams")}
${buildPillarColumn("symbol", "Symbols")}
${buildPillarColumn("number", "Numbers")}
  </div>`;

// Replace the entire <div class="topics__grid">...</div> block
spaHtml = spaHtml.replace(
  /<div class="topics__grid">[\s\S]*?<\/div>\s*<\/section>/,
  `${newGrid}\n</section>`
);

writeFileSync(indexPath, spaHtml, "utf8");
console.log("  ✓ SPA topics surface");

// ---------- 3. Hub pages — intro essay + FAQ + FAQPage schema ----------
// Featured-card sections are owned by the hub HTML; enrich-hubs.mjs handles
// intro + FAQ injection via markers. Comprehensive "All N" list is intentionally
// not injected on hubs — the curated Featured cards are the SEO surface.
await import("./enrich-hubs.mjs");

// ---------- 4. Schema enrichment (Article + BreadcrumbList JSON-LD) ----------
await import("./enrich-schema.mjs");

// ---------- 5. Related-interpretation links (internal linking density) ----------
await import("./enrich-related-links.mjs");

// ---------- 6. Navigation: brand-as-link + breadcrumb on hubs/pages ----------
await import("./add-nav.mjs");

// ---------- 7. Plausible analytics injection ----------
await import("./add-plausible.mjs");

// ---------- 7.4. AdSense loader (Auto Ads) injection ----------
await import("./add-adsense.mjs");

// ---------- 7.5. Newsletter signup block + /newsletter.js + CSS ----------
await import("./add-newsletter.mjs");

// ---------- 8. Bump SW cache ----------
const swPath = resolve(DIST, "sw.js");
let sw = readFileSync(swPath, "utf8");
const m = sw.match(/psysymbol-v(\d+)/);
if (m) {
  const next = parseInt(m[1], 10) + 1;
  sw = sw.replace(/psysymbol-v\d+/, `psysymbol-v${next}`);
  writeFileSync(swPath, sw, "utf8");
  console.log(`  ✓ sw.js cache: v${m[1]} → v${next}`);
}

console.log("");
console.log(`Wire-up complete. ${totalPages} pages indexed across ${PILLARS.length} pillars.`);
