// Pinterest pin generator. One 1000x1500 PNG per interpretation page.
// Editorial-twilight palette matching dist/app.css.
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

// Visual constants — editorial-twilight palette.
const W = 1000;
const H = 1500;
const BG = "#10131c";
const BG_GRAD_INNER = "#1a1f2e";
const ACCENT = "#d4a574";
const INDIGO = "#b3a0e5";
const TEXT = "#ece6d8";
const TEXT_MUTED = "#9a96a8";
const BORDER = "#2a2f42";

// Title overrides — same vocabulary as wire-up.mjs / enrich-related-links.mjs.
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

function teaserFor(pillar, slug) {
  const name = displayName(slug);
  if (pillar === "dream") return `What it means when you dream of ${name.toLowerCase()}`;
  if (pillar === "symbol") return `The meaning of ${name.toLowerCase()} as a symbol`;
  if (pillar === "number") return `The meaning of seeing ${name}`;
  return name;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[c]));
}

// Manual word-wrap. Returns array of lines fitting ~maxCharsPerLine.
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
  const teaser = teaserFor(pillar, slug);

  // Headline sizing: 1-2 short words → big (140px), 3+ words or long → medium (105px).
  const wc = headline.split(" ").length;
  const totalLen = headline.length;
  let headlineSize;
  if (wc === 1 && totalLen <= 9) headlineSize = 150;
  else if (totalLen <= 14) headlineSize = 130;
  else if (totalLen <= 22) headlineSize = 105;
  else headlineSize = 88;

  const headlineLines = wrap(headline, headlineSize >= 130 ? 11 : headlineSize >= 105 ? 15 : 18);
  const teaserLines = wrap(teaser, 32);

  // Layout calc: pillar tag → headline → divider → teaser → brand mark.
  const headlineStartY = 460;
  const lineHeight = headlineSize * 1.02;
  const headlineBlockH = headlineLines.length * lineHeight;
  const dividerY = headlineStartY + headlineBlockH + 30;
  const teaserStartY = dividerY + 70;
  const teaserLineHeight = 40;

  const headlineTspans = headlineLines
    .map((line, i) => `<tspan x="500" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const teaserTspans = teaserLines
    .map((line, i) => `<tspan x="500" dy="${i === 0 ? 0 : teaserLineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  // Decorative star (the PsySymbol mark) — five-pointed at bottom.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="${BG_GRAD_INNER}" />
      <stop offset="100%" stop-color="${BG}" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />

  <!-- Border accent -->
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none"
        stroke="${BORDER}" stroke-width="2" rx="20" />

  <!-- Pillar tag -->
  <rect x="${500 - 110}" y="200" width="220" height="56" rx="28"
        fill="none" stroke="${ACCENT}" stroke-width="2" />
  <text x="500" y="237" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="22" font-weight="600" letter-spacing="6"
        fill="${ACCENT}">${PILLAR_LABEL[pillar]}</text>

  <!-- Topic word above headline -->
  <text x="500" y="330" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="38" font-style="italic"
        fill="${TEXT_MUTED}">on the meaning of</text>

  <!-- Headline -->
  <text x="500" y="${headlineStartY}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="${headlineSize}" font-weight="700"
        fill="${TEXT}">${headlineTspans}</text>

  <!-- Gold divider -->
  <line x1="${500 - 80}" y1="${dividerY}" x2="${500 + 80}" y2="${dividerY}"
        stroke="${ACCENT}" stroke-width="2" />

  <!-- Teaser -->
  <text x="500" y="${teaserStartY}" text-anchor="middle"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="32" font-style="italic"
        fill="${INDIGO}">${teaserTspans}</text>

  <!-- Brand mark: Ψ glyph in gold + wordmark -->
  <text x="500" y="${H - 165}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="96" font-weight="700"
        fill="${ACCENT}">Ψ</text>
  <text x="500" y="${H - 95}" text-anchor="middle"
        font-family="'Iowan Old Style', 'Georgia', serif"
        font-size="36" font-weight="600" letter-spacing="3"
        fill="${TEXT}">PsySymbol</text>
  <text x="500" y="${H - 55}" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="22" letter-spacing="4"
        fill="${TEXT_MUTED}">${SITE}</text>
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

    if (existsSync(outPath) && !FORCE) {
      skipped++;
      catalogue.push({
        pillar, slug,
        title: displayName(slug),
        page_url: `https://${SITE}/${pillar}/${slug}.html`,
        pin_url: `https://${SITE}/pins/${pillar}/${slug}.png`,
        alt_text: `${displayName(slug)} ${pillar} meaning — PsySymbol`,
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
      title: displayName(slug),
      page_url: `https://${SITE}/${pillar}/${slug}.html`,
      pin_url: `https://${SITE}/pins/${pillar}/${slug}.png`,
      alt_text: `${displayName(slug)} ${pillar} meaning — PsySymbol`,
    });
  }
}

// Write catalogue — used by future upload automation or manual scheduling.
catalogue.sort((a, b) => {
  const pa = PILLARS.indexOf(a.pillar);
  const pb = PILLARS.indexOf(b.pillar);
  if (pa !== pb) return pa - pb;
  return a.slug.localeCompare(b.slug);
});
writeFileSync(resolve(PINS_DIR, "index.json"), JSON.stringify(catalogue, null, 2));

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`Pins: ${generated} generated, ${skipped} skipped (already on disk). ${elapsed}s. Catalogue: ${catalogue.length} entries.`);
