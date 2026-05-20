// IndexNow ping — instant-indexing protocol for Bing, Yandex, Naver, Seznam, IndexNow.org.
// Reads dist/sitemap.xml, extracts URLs, POSTs them to api.indexnow.org.
//
// Requires the key file (dist/<KEY>.txt) to be reachable at https://psysymbol.com/<KEY>.txt.
// While the apex domain is parked at Sedo, this script will fail validation.
// Run after each significant content batch — and on the first deploy once DNS resolves.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const KEY = "bfd49b2104d7a9c20d44550ca364eeca";
const HOST = "psysymbol.com";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const sitemapXml = readFileSync(resolve(DIST, "sitemap.xml"), "utf8");
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

if (urls.length === 0) {
  console.error("No URLs found in sitemap.xml.");
  process.exit(1);
}

// IndexNow caps at 10,000 URLs per request — we'll never hit that with this corpus.
const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

console.log(`Pinging IndexNow with ${urls.length} URLs from ${HOST}…`);

const resp = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

const text = await resp.text();

if (resp.status === 200 || resp.status === 202) {
  console.log(`✓ IndexNow accepted ${urls.length} URLs (HTTP ${resp.status}).`);
} else {
  console.error(`✗ IndexNow returned HTTP ${resp.status}.`);
  console.error(`  Response: ${text || "(empty body)"}`);
  console.error(`  Common causes:`);
  console.error(`    - 422: key file unreachable at ${KEY_LOCATION} (DNS not yet pointing to Netlify?)`);
  console.error(`    - 400: malformed URLs or wrong host`);
  console.error(`    - 403: key mismatch between request and key file`);
  process.exit(1);
}
