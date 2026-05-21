// Makes the brand/logo a link back to the homepage on any page where it isn't already.
// Content pages and hubs already render the brand as <a class="brand" href="/"> (via
// add-nav.mjs); the hand-written static pages (about, methodology, privacy, terms,
// contact) shipped with a non-linked <div class="brand">, leaving no way back to home.
// This converts that div into the same anchor, so every page reachable from the
// homepage can return to it. Idempotent: once converted there is no <div class="brand">
// left to match.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

// Match the brand div block: opening tag, its inner content (svg + name), and the
// matching outer </div>. The inner content closes two nested divs after the tagline,
// then the third </div> is the brand wrapper we convert to </a>.
const BRAND_DIV_RE =
  /<div class="brand">([\s\S]*?Dreams · Symbols · Numbers<\/div>\s*<\/div>\s*)<\/div>/;

const OPEN_ANCHOR =
  '<a class="brand" href="/" aria-label="PsySymbol — home" style="text-decoration:none;color:inherit">';

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "pins") continue;
      walk(full, files);
    } else if (entry.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

let converted = 0;
let alreadyOk = 0;
for (const f of walk(DIST)) {
  let html = readFileSync(f, "utf8");
  if (!BRAND_DIV_RE.test(html)) {
    alreadyOk++;
    continue;
  }
  html = html.replace(BRAND_DIV_RE, `${OPEN_ANCHOR}$1</a>`);
  writeFileSync(f, html, "utf8");
  converted++;
}

console.log(
  `Home-link: ${converted} pages converted (brand div → home anchor), ${alreadyOk} already linked/skipped.`
);
