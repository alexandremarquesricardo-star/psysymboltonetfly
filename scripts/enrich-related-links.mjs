// Injects a "Related interpretations" section into every interpretation page.
// Strategy: score candidates by (1) same-slug cross-pillar match, (2) slug-token overlap.
// Deterministic ordering — same input → same output, so git diffs are clean.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const PILLARS = ["dream", "symbol", "number"];
const PILLAR_LABEL = { dream: "Dream", symbol: "Symbol", number: "Number" };

const MARKER_START = "<!-- internal-links:related -->";
const MARKER_END = "<!-- /internal-links:related -->";
const TARGET_COUNT = 8;

// Manual display overrides — kept short, focused on slugs the auto-capitalizer mangles.
const DISPLAY_OVERRIDES = {
  "being-chased": "Being chased",
  "teeth-falling-out": "Teeth falling out",
  "ex-partner": "Dreaming of an ex",
  "dead-person-alive": "Dead person alive",
  "house-on-fire": "House on fire",
  "car-accident": "Car accident",
  "naked-in-public": "Naked in public",
  "losing-keys": "Losing keys",
  "lost-wallet": "Lost wallet",
  "butterfly-flying": "Butterfly flying",
  "snake-biting": "Snake biting",
  "snake-attacking": "Snake attacking",
  "being-late": "Being late",
  "black-cat": "Black cat",
};

function displayName(slug) {
  if (DISPLAY_OVERRIDES[slug]) return DISPLAY_OVERRIDES[slug];
  return slug
    .split("-")
    .map(w => (w.match(/^\d+$/) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function readSlugs(pillar) {
  const dir = resolve(DIST, pillar);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".html") && f !== "index.html")
    .map(f => f.replace(/\.html$/, ""))
    .sort();
}

const corpus = Object.fromEntries(PILLARS.map(p => [p, readSlugs(p)]));

// Build numeric-neighbor map for number slugs (777 → 666, 888, etc.).
function numericNeighbors(slug, pool) {
  const n = parseInt(slug, 10);
  if (isNaN(n)) return [];
  const numeric = pool
    .map(s => ({ s, n: parseInt(s, 10) }))
    .filter(x => !isNaN(x.n) && x.s !== slug);
  // Closest by absolute distance, then by share-of-digits.
  numeric.sort((a, b) => {
    const da = Math.abs(a.n - n);
    const db = Math.abs(b.n - n);
    if (da !== db) return da - db;
    return a.n - b.n;
  });
  return numeric.slice(0, 4).map(x => x.s);
}

function tokenOverlap(slugA, slugB) {
  const a = new Set(slugA.split("-"));
  const b = slugB.split("-");
  let overlap = 0;
  for (const t of b) if (a.has(t) && t.length > 2) overlap++;
  return overlap;
}

function scoreCandidates(pillar, slug) {
  const candidates = [];
  const seen = new Set([`${pillar}:${slug}`]);

  // Tier 1: cross-pillar same-slug match (highest signal — same concept, different lens).
  for (const p of PILLARS) {
    if (p === pillar) continue;
    if (corpus[p].includes(slug)) {
      candidates.push({ pillar: p, slug, score: 100 });
      seen.add(`${p}:${slug}`);
    }
  }

  // Tier 2: numeric neighbors for the number pillar.
  if (pillar === "number") {
    for (const n of numericNeighbors(slug, corpus[pillar])) {
      const key = `${pillar}:${n}`;
      if (seen.has(key)) continue;
      candidates.push({ pillar, slug: n, score: 50 });
      seen.add(key);
    }
  }

  // Tier 3: same-pillar token overlap.
  for (const other of corpus[pillar]) {
    const key = `${pillar}:${other}`;
    if (seen.has(key)) continue;
    const overlap = tokenOverlap(slug, other);
    if (overlap > 0) {
      candidates.push({ pillar, slug: other, score: 20 + overlap * 10 });
      seen.add(key);
    }
  }

  // Tier 4: cross-pillar token overlap.
  for (const p of PILLARS) {
    if (p === pillar) continue;
    for (const other of corpus[p]) {
      const key = `${p}:${other}`;
      if (seen.has(key)) continue;
      const overlap = tokenOverlap(slug, other);
      if (overlap > 0) {
        candidates.push({ pillar: p, slug: other, score: 10 + overlap * 5 });
        seen.add(key);
      }
    }
  }

  // Tier 5 (fallback): same-pillar deterministic neighbors by alphabetical proximity.
  // Ensures every page reaches TARGET_COUNT even with no token overlap.
  const samePillar = corpus[pillar].filter(s => s !== slug);
  const idx = samePillar.indexOf(slug); // -1 since we filtered, so use position computed differently
  const fullList = corpus[pillar];
  const selfIdx = fullList.indexOf(slug);
  const ring = [];
  for (let offset = 1; offset <= fullList.length && ring.length < TARGET_COUNT; offset++) {
    const fwd = fullList[(selfIdx + offset) % fullList.length];
    if (fwd && fwd !== slug) ring.push(fwd);
    const bwd = fullList[(selfIdx - offset + fullList.length) % fullList.length];
    if (bwd && bwd !== slug && bwd !== fwd) ring.push(bwd);
  }
  for (const other of ring) {
    const key = `${pillar}:${other}`;
    if (seen.has(key)) continue;
    candidates.push({ pillar, slug: other, score: 1 });
    seen.add(key);
  }

  // Stable sort by score desc, then by pillar order, then slug alpha.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = PILLARS.indexOf(a.pillar);
    const pb = PILLARS.indexOf(b.pillar);
    if (pa !== pb) return pa - pb;
    return a.slug.localeCompare(b.slug);
  });

  return candidates.slice(0, TARGET_COUNT);
}

function buildBlock(pillar, slug) {
  const picks = scoreCandidates(pillar, slug);
  const items = picks
    .map(p => `      <li><a href="/${p.pillar}/${p.slug}.html"><span class="related-interpretations__kind">${PILLAR_LABEL[p.pillar]}</span> ${displayName(p.slug)}</a></li>`)
    .join("\n");

  return [
    MARKER_START,
    `    <section class="related-interpretations" aria-label="More interpretations to explore">`,
    `      <h2>More interpretations to explore</h2>`,
    `      <ul class="related-interpretations__list">`,
    items,
    `      </ul>`,
    `    </section>`,
    MARKER_END,
  ].join("\n");
}

function enrichFile(filePath, pillar, slug) {
  let html = readFileSync(filePath, "utf8");
  const block = buildBlock(pillar, slug);

  const markerRe = new RegExp(`[ \\t]*${MARKER_START}[\\s\\S]*?${MARKER_END}`);
  if (markerRe.test(html)) {
    html = html.replace(markerRe, block);
  } else {
    // Insert just before </main>.
    if (!/<\/main>/i.test(html)) {
      console.warn(`  ⚠ ${pillar}/${slug}.html — no </main>; skipped`);
      return false;
    }
    html = html.replace(/<\/main>/i, `${block}\n    </main>`);
  }

  writeFileSync(filePath, html, "utf8");
  return true;
}

let updated = 0;
let skipped = 0;
for (const pillar of PILLARS) {
  for (const slug of corpus[pillar]) {
    const ok = enrichFile(resolve(DIST, pillar, `${slug}.html`), pillar, slug);
    if (ok) updated++; else skipped++;
  }
}

console.log(`Related-links enrichment: ${updated} pages updated, ${skipped} skipped.`);
