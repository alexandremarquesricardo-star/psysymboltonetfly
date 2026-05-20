// Navigation fix: makes the brand area a real link to /, and adds a
// breadcrumb (Home > Dreams > Snake) right after the header on every
// interpretation and hub page.
//
// Idempotent: wraps existing brand div (only if not already wrapped) and
// replaces existing breadcrumb block via markers.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const PILLARS = ["dream", "symbol", "number"];
const PILLAR_LABEL = { dream: "Dreams", symbol: "Symbols", number: "Numbers" };

const MARKER_START = "<!-- nav:breadcrumb -->";
const MARKER_END = "<!-- /nav:breadcrumb -->";

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
  "tree-of-life": "Tree of Life",
  "yin-yang": "Yin Yang",
  "eye-of-horus": "Eye of Horus",
  "eye-of-providence": "Eye of Providence",
  "star-of-david": "Star of David",
  "celtic-cross": "Celtic cross",
  "celtic-knot": "Celtic knot",
  "trinity-knot": "Trinity knot",
  "third-eye": "Third eye",
  "evil-eye": "Evil eye",
  "snake-shedding": "Snake shedding skin",
  "feather-white": "White feather",
  "feather-black": "Black feather",
  "spider-symbol": "Spider symbol",
  "key-and-lock": "Key and lock",
  "sun-and-moon": "Sun and Moon",
  "oak-tree": "Oak tree",
};

function displayName(slug) {
  if (DISPLAY_OVERRIDES[slug]) return DISPLAY_OVERRIDES[slug];
  return slug
    .split("-")
    .map(w => (w.match(/^\d+$/) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// Wrap `<div class="brand">…</div>` with an anchor pointing to "/".
// Only acts if the brand isn't already wrapped (no preceding <a class="brand").
function wrapBrand(html) {
  if (/<a[^>]*class="brand"/i.test(html)) return html; // already an anchor
  return html.replace(
    /<div class="brand">([\s\S]*?)<\/div>\s*<\/header>/i,
    `<a class="brand" href="/" aria-label="PsySymbol — home">$1</a>\n    </header>`
  );
}

function buildBreadcrumb(pillar, slug) {
  const isHub = slug === null;
  const items = [
    { text: "Home", href: "/" },
    isHub
      ? { text: PILLAR_LABEL[pillar], current: true }
      : { text: PILLAR_LABEL[pillar], href: `/${pillar}/` },
  ];
  if (!isHub) items.push({ text: displayName(slug), current: true });

  const parts = items.map((it, i) => {
    const sep = i > 0 ? `<span aria-hidden="true" class="breadcrumb__sep">›</span>` : "";
    const node = it.current
      ? `<span aria-current="page">${escapeHtml(it.text)}</span>`
      : `<a href="${it.href}">${escapeHtml(it.text)}</a>`;
    return sep + node;
  });

  return [
    MARKER_START,
    `    <nav class="breadcrumb" aria-label="Breadcrumb">`,
    `      ${parts.join("\n      ")}`,
    `    </nav>`,
    MARKER_END,
  ].join("\n");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function addBreadcrumb(html, pillar, slug) {
  const block = buildBreadcrumb(pillar, slug);
  const re = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`);
  if (re.test(html)) return html.replace(re, block);

  // Insert between </header> and the next opening tag (usually <main>).
  if (/<\/header>/i.test(html)) {
    return html.replace(/<\/header>/i, `</header>\n\n${block}`);
  }
  return html; // no header — skip
}

function processFile(filePath, pillar, slug) {
  let html = readFileSync(filePath, "utf8");
  const before = html;
  html = wrapBrand(html);
  html = addBreadcrumb(html, pillar, slug);
  if (html !== before) {
    writeFileSync(filePath, html, "utf8");
    return true;
  }
  return false;
}

let updated = 0;
let skipped = 0;
for (const pillar of PILLARS) {
  const dir = resolve(DIST, pillar);
  if (!existsSync(dir)) continue;

  // Hub page (slug = null → "Home > Dreams" only).
  const hubPath = resolve(dir, "index.html");
  if (existsSync(hubPath)) {
    if (processFile(hubPath, pillar, null)) updated++;
    else skipped++;
  }

  // Interpretation pages.
  const files = readdirSync(dir).filter(f => f.endsWith(".html") && f !== "index.html");
  for (const f of files) {
    const slug = f.replace(/\.html$/, "");
    if (processFile(resolve(dir, f), pillar, slug)) updated++;
    else skipped++;
  }
}

console.log(`Nav fix: ${updated} pages updated, ${skipped} unchanged.`);
