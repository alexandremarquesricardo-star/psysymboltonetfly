// Injects the Plausible analytics snippet into every HTML page under dist/.
// Idempotent via marker comments — re-runs replace the existing block.
// Plausible is privacy-friendly, no cookies, no consent banner required for EU/UK.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const MARKER_START = "<!-- analytics:plausible -->";
const MARKER_END = "<!-- /analytics:plausible -->";

const BLOCK = [
  MARKER_START,
  `<script async src="https://plausible.io/js/pa-DnYMJlIWE2k5g7HR2EuqP.js"></script>`,
  `<script>window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()</script>`,
  MARKER_END,
].join("\n");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // Skip the pins/ directory — pure binary output, no HTML there.
      if (entry === "pins") continue;
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

  const markerRe = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`);
  if (markerRe.test(html)) {
    html = html.replace(markerRe, BLOCK);
  } else {
    html = html.replace(/<\/head>/i, `${BLOCK}\n</head>`);
  }

  writeFileSync(filePath, html, "utf8");
  return true;
}

const files = walk(DIST);
let updated = 0;
let skipped = 0;
for (const f of files) {
  const ok = inject(f);
  if (ok) updated++; else skipped++;
}

console.log(`Plausible injection: ${updated} pages updated, ${skipped} skipped (no </head>).`);
