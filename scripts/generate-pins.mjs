// Pinterest pin generator v2.
// One 1000x1500 PNG per interpretation page, editorial-twilight palette.
// Teasers are pulled from each page's <meta name="description"> (first sentence).
//
// Output: dist/pins/{pillar}/{slug}.png + dist/pins/index.json (catalogue).
// Idempotent: skips files that already exist on disk unless --force is passed.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const PINS_DIR = resolve(DIST, "pins");

const PILLARS = ["dream", "symbol", "number"];
const PILLAR_LABEL = { dream: "DREAM", symbol: "SYMBOL", number: "NUMBER" };
const FORCE = process.argv.includes("--force");

const SITE = "psysymbol.com";

const W = 1000;
const H = 1500;
const BG = "#10131c";
const BG_GRAD_INNER = "#1a1f2e";
const ACCENT = "#d4a574";
const INDIGO = "#b3a0e5";
const TEXT = "#ece6d8";
const TEXT_MUTED = "#9a96a8";
const TEXT_FAINT = "#6a6678";
const BORDER = "#2a2f42";

const DISPLAY_OVERRIDES = {
  "being-chased": "Being Chased",
  "teeth-falling-out": "Teeth Falling Out",
  "ex-partner": "Dreaming of an Ex",
  "dead-person-alive": "A Dead Person Alive",
  "house-on-fire": "House on Fire",
  "car-accident": "Car Accident",
  "naked-in-public": "Naked in Public",
  "losing-keys": "Losing Keys",
  "lost-wallet": "A Lost Wallet",
  "butterfly-flying": "Butterfly Flying",
  "snake-biting": "Snake Biting",
  "snake-attacking": "Snake Attacking",
  "being-late": "Being Late",
  "black-cat": "Black Cat",
  "tree-of-life": "Tree of Life",
  "yin-yang": "Yin Yang",
  "eye-of-horus": "Eye of Horus",
  "eye-of-providence": "Eye of Providence",
  "star-of-david": "Star of David",
  "celtic-cross": "Celtic Cross",
  "celtic-knot": "Celtic Knot",
  "trinity-knot": "Trinity Knot",
  "third-eye": "Third Eye",
  "evil-eye": "Evil Eye",
  "snake-shedding": "Snake Shedding Skin",
  "feather-white": "White Feather",
  "feather-black": "Black Feather",
  "spider-symbol": "Spider Symbol",
  "key-and-lock": "Key and Lock",
  "sun-and-moon": "Sun and Moon",
  "oak-tree": "Oak Tree",
};

function displayName(slug) {
  if (DISPLAY_OVERRIDES[slug]) return DISPLAY_OVERRIDES[slug];
  return slug
    .split("-")
    .map(w => (w.match(/^\d+$/) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// Pull the meta description from the corresponding HTML page, return the
// first sentence (or a smart-truncated chunk) for use as a Pinterest teaser.
function teaserFromPage(pillar, slug, headline) {
  const pagePath = resolve(DIST, pillar, `${slug}.html`);
  if (!existsSync(pagePath)) return fallbackTeaser(pillar, headline);

  const html = readFileSync(pagePath, "utf8");
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!m) return fallbackTeaser(pillar, headline);

  const desc = m[1]
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

  // Take the first sentence — most descriptions lead with a strong line.
  const firstSentence = desc.split(/(?<=[.!?])\s+/)[0];
  if (firstSentence.length <= 110) return firstSentence;

  // Otherwise truncate at word boundary near 100 chars, stripping any
  // trailing punctuation before the ellipsis so we never produce ",…".
  const cut = desc.slice(0, 100);
  const lastSpace = cut.lastIndexOf(" ");
  const slice = desc.slice(0, lastSpace > 50 ? lastSpace : 100);
  return slice.replace(/[,;:—-]+$/, "").trimEnd() + "…";
}

function fallbackTeaser(pillar, headline) {
  if (pillar === "dream") return `The dream meaning of ${headline.toLowerCase()}`;
  if (pillar === "symbol") return `The symbolism of ${headline.toLowerCase()}`;
  if (pillar === "number") return `The meaning of seeing ${headline}`;
  return headline;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[c]));
}

function wrap(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line) { line = word; continue; }
    if ((line + " " + word).length > maxCharsPerLine) {
      lines.push(line);
      line = word;
    } else {
      line += " " + word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildSvg(pillar, slug) {
  const headline = displayName(slug);
  const teaser = teaserFromPage(pillar, slug, headline);

  // Headline sizing — conservative because resvg fallback font runs tall.
  const totalLen = headline.length;
  let headlineSize;
  if (totalLen <= 6) headlineSize = 130;
  else if (totalLen <= 10) headlineSize = 115;
  else if (totalLen <= 16) headlineSize = 95;
  else if (totalLen <= 24) headlineSize = 80;
  else headlineSize = 68;

  const headlineLines = wrap(headline, headlineSize >= 110 ? 9 : headlineSize >= 90 ? 14 : 20);
  const teaserLines = wrap(teaser, 30);

  // Compositional layout — vertically balanced, no overlap.
  const pillarY = 195;
  const eyebrowY = 290;
  const headlineStartY = 480;
  const headlineLineH = headlineSize * 1.05;
  const headlineBlockH = headlineLines.length * headlineLineH;
  const dividerY = headlineStartY + headlineBlockH + 40;
  const teaserStartY = dividerY + 70;
  const teaserLineH = 44;
  const teaserBlockH = teaserLines.length * teaserLineH;
  const ornamentY = Math.min(teaserStartY + teaserBlockH + 70, H - 320);
  const brandY = H - 220;

  const headlineTspans = headlineLines
    .map((line, i) => `<tspan x="500" dy="${i === 0 ? 0 : headlineLineH}">${escapeXml(line)}</tspan>`)
    .join("");

  const teaserTspans = teaserLines
    .map((line, i) => `<tspan x="500" dy="${i === 0 ? 0 : teaserLineH}">${escapeXml(line)}</tspan>`)
    .join("");

  // Constellation ornament — 5 dots, alternating sizes.
  const ornamentDots = [
    { x: 380, r: 3 },
    { x: 430, r: 5 },
    { x: 500, r: 7 },
    { x: 570, r: 5 },
    { x: 620, r: 3 },
  ].map(d => `<circle cx="${d.x}" cy="${ornamentY}" r="${d.r}" fill="${ACCENT}" opacity="0.6" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${BG_GRAD_INNER}" />
      <stop offset="100%" stop-color="${BG}" />
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${BORDER}" stroke-width="2" rx="20" />

  <!-- Pillar pill -->
  <rect x="${500 - 110}" y="${pillarY - 35}" width="220" height="56" rx="28" fill="none" stroke="${ACCENT}" stroke-width="2" />
  <text x="500" y="${pillarY}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="22" font-weight="600" letter-spacing="6"
        fill="${ACCENT}">${PILLAR_LABEL[pillar]}</text>

  <!-- "on the meaning of" eyebrow -->
  <text x="500" y="${eyebrowY}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="36" font-style="italic"
        fill="${TEXT_MUTED}">on the meaning of</text>

  <!-- Headline -->
  <text x="500" y="${headlineStartY}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="${headlineSize}" font-weight="700"
        fill="${TEXT}">${headlineTspans}</text>

  <!-- Gold divider -->
  <line x1="${500 - 80}" y1="${dividerY}" x2="${500 + 80}" y2="${dividerY}" stroke="${ACCENT}" stroke-width="2" />

  <!-- Teaser (page meta description, first sentence) -->
  <text x="500" y="${teaserStartY}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="34" font-style="italic"
        fill="${INDIGO}">${teaserTspans}</text>

  <!-- Constellation ornament -->
  ${ornamentDots}

  <!-- Brand mark: Ψ glyph + wordmark + URL -->
  <text x="500" y="${brandY}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="96" font-weight="700"
        fill="${ACCENT}">Ψ</text>
  <text x="500" y="${brandY + 70}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="36" font-weight="600" letter-spacing="3"
        fill="${TEXT}">PsySymbol</text>
  <text x="500" y="${brandY + 110}" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="22" letter-spacing="4"
        fill="${TEXT_FAINT}">${SITE}</text>
</svg>`;
}

function readSlugs(pillar) {
  const dir = resolve(DIST, pillar);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".html") && f !== "index.html")
    .map(f => f.replace(/\.html$/, ""))
    .sort();
}

if (!existsSync(PINS_DIR)) mkdirSync(PINS_DIR, { recursive: true });

const catalogue = [];
let generated = 0;
let skipped = 0;
const startedAt = Date.now();

for (const pillar of PILLARS) {
  const pillarDir = resolve(PINS_DIR, pillar);
  if (!existsSync(pillarDir)) mkdirSync(pillarDir, { recursive: true });

  for (const slug of readSlugs(pillar)) {
    const outPath = resolve(pillarDir, `${slug}.png`);
    const description = displayName(slug);

    if (existsSync(outPath) && !FORCE) {
      skipped++;
      catalogue.push({
        pillar, slug,
        title: description,
        page_url: `https://${SITE}/${pillar}/${slug}.html`,
        pin_url: `https://${SITE}/pins/${pillar}/${slug}.png`,
        alt_text: `${description} ${pillar} meaning — PsySymbol`,
      });
      continue;
    }

    const svg = buildSvg(pillar, slug);
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: W },
      font: { loadSystemFonts: true },
    });
    const pngData = resvg.render().asPng();
    writeFileSync(outPath, pngData);
    generated++;

    catalogue.push({
      pillar, slug,
      title: description,
      page_url: `https://${SITE}/${pillar}/${slug}.html`,
      pin_url: `https://${SITE}/pins/${pillar}/${slug}.png`,
      alt_text: `${description} ${pillar} meaning — PsySymbol`,
    });
  }
}

catalogue.sort((a, b) => {
  const pa = PILLARS.indexOf(a.pillar);
  const pb = PILLARS.indexOf(b.pillar);
  if (pa !== pb) return pa - pb;
  return a.slug.localeCompare(b.slug);
});
writeFileSync(resolve(PINS_DIR, "index.json"), JSON.stringify(catalogue, null, 2));

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`Pins v2: ${generated} generated, ${skipped} skipped. ${elapsed}s. Catalogue: ${catalogue.length} entries.`);
