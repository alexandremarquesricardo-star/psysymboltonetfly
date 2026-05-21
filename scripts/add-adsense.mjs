// Injects the Google AdSense loader + site-ownership meta into every HTML page under dist/.
// Idempotent via marker comments — re-runs replace the existing block and de-dupe any
// bare google-adsense-account meta tags that predate this script (homepage, privacy).
//
// Revenue model: AdSense Auto Ads. This script only places the account-level loader
// site-wide (required for both site review/approval AND Auto Ads serving). The actual
// ad placement is decided by Google once Auto Ads is toggled ON in the AdSense dashboard
// (a one-time account action the human owner performs).

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const PUB_ID = "ca-pub-3857946786580406";

const MARKER_START = "<!-- adsense:auto -->";
const MARKER_END = "<!-- /adsense:auto -->";

const BLOCK = [
  MARKER_START,
  `<meta name="google-adsense-account" content="${PUB_ID}">`,
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}" crossorigin="anonymous"></script>`,
  MARKER_END,
].join("\n");

// Bare ownership meta that predates this script (homepage line 2, privacy). Strip so the
// canonical marker block is the single source of truth.
const BARE_META_RE = /<meta\s+name="google-adsense-account"[^>]*>\s*/gi;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "pins") continue; // binary output, no HTML
      walk(full, files);
    } else if (entry.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function inject(filePath) {
  let html = readFileSync(filePath, "utf8");
  if (!/<\/head>/i.test(html)) return false;

  // 1. Remove any prior marker block so we re-inject a fresh canonical one.
  const markerRe = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}\\s*`);
  html = html.replace(markerRe, "");

  // 2. Remove any bare ownership meta tags left outside the markers.
  html = html.replace(BARE_META_RE, "");

  // 3. Inject the canonical block immediately before </head>.
  html = html.replace(/<\/head>/i, `${BLOCK}\n</head>`);

  writeFileSync(filePath, html, "utf8");
  return true;
}

const files = walk(DIST);
let updated = 0;
let skipped = 0;
for (const f of files) {
  if (inject(f)) updated++;
  else skipped++;
}

console.log(`AdSense injection: ${updated} pages updated, ${skipped} skipped (no </head>).`);
