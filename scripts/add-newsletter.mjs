// Injects the newsletter signup section + /newsletter.js include into every page,
// and appends the newsletter CSS to the two stylesheets. Idempotent (marker-based),
// so it's safe to re-run as part of wire-up.mjs or standalone.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const BLOCK = `<!-- newsletter:start -->
    <section class="newsletter" aria-label="Newsletter signup">
      <h2>The daily symbol, in your inbox</h2>
      <p>One considered dream, symbol, or number reading each day. No spam — unsubscribe anytime.</p>
      <form data-newsletter class="newsletter__form" novalidate>
        <input type="email" name="email" required placeholder="you@example.com" aria-label="Email address" autocomplete="email" />
        <input type="text" name="company" class="newsletter__hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <button type="submit">Subscribe</button>
      </form>
      <p class="newsletter__status" role="status" aria-live="polite" hidden></p>
    </section>
<!-- newsletter:end -->`;

const BLOCK_RE = /<!-- newsletter:start -->[\s\S]*?<!-- newsletter:end -->/;
const SCRIPT_TAG = `<script src="/newsletter.js" defer></script>`;

const CSS = `
/* newsletter-css */
.newsletter{max-width:640px;margin:2.5rem auto;padding:1.5rem 1.25rem;text-align:center;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}
.newsletter h2{margin:0 0 .35rem;font-size:1.2rem;line-height:1.25}
.newsletter p{margin:0 0 1rem;opacity:.85}
.newsletter__form{display:flex;gap:.5rem;max-width:440px;margin:0 auto;flex-wrap:wrap;justify-content:center}
.newsletter__form input[type=email]{flex:1 1 220px;min-width:0;padding:.65rem .8rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:inherit;font:inherit}
.newsletter__form button{padding:.65rem 1.2rem;border-radius:10px;border:0;cursor:pointer;font:inherit;font-weight:600;background:#efeadf;color:#161821}
.newsletter__form button:disabled{opacity:.6;cursor:default}
.newsletter__status{margin:.75rem 0 0;font-size:.9rem;opacity:.9}
.newsletter__status--error{color:#ef9a9a;opacity:1}
.newsletter__hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}
`;

function injectBlock(html) {
  if (BLOCK_RE.test(html)) {
    return html.replace(BLOCK_RE, BLOCK);
  }
  // Static pages (interp pages, hubs, standalone) use <footer class="footer">.
  if (html.includes('<footer class="footer">')) {
    return html.replace('<footer class="footer">', `${BLOCK}\n\n    <footer class="footer">`);
  }
  // SPA homepage uses a bare <footer>.
  if (/\n<footer>/.test(html)) {
    return html.replace(/\n<footer>/, `\n${BLOCK}\n\n<footer>`);
  }
  return html; // no recognizable footer — leave untouched
}

function injectScript(html) {
  if (html.includes("/newsletter.js")) return html;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${SCRIPT_TAG}\n</body>`);
  }
  return html;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

let pages = 0;
for (const file of walk(DIST)) {
  const before = readFileSync(file, "utf8");
  let after = injectBlock(before);
  after = injectScript(after);
  if (after !== before) {
    writeFileSync(file, after, "utf8");
    pages++;
  }
}
console.log(`  ✓ newsletter block injected into ${pages} pages`);

// Append CSS to both stylesheets if not already present.
for (const css of ["app.css", "style.css"]) {
  const p = resolve(DIST, css);
  if (!existsSync(p)) continue;
  const cur = readFileSync(p, "utf8");
  if (cur.includes("/* newsletter-css */")) continue;
  writeFileSync(p, cur + CSS, "utf8");
  console.log(`  ✓ newsletter CSS appended to ${css}`);
}
