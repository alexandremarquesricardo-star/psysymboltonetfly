// Repairs pages that were truncated mid-sentence during the Sprint 8 AI generation run.
// Detection: page is missing `<script src="/app.js"` near the end (indicating no closing block).
// Repair: truncate at last well-formed </p>, append a clean closing structure.
//
// Idempotent: re-running on already-repaired pages is a no-op.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const PILLARS = ["dream", "symbol", "number"];

const PILLAR_ARTICLE_NOUN = {
  dream: "dream",
  symbol: "symbol",
  number: "number",
};

function closingBlock(pillar) {
  const noun = PILLAR_ARTICLE_NOUN[pillar];
  return `
    </main>

    <div class="disclaimer">
      Interpretations on PsySymbol are reflective tools, not predictions or clinical advice. If a recurring ${noun} is genuinely affecting your sleep, mood, or wellbeing, a therapist will help more directly than any symbolic reading. See our <a href="/methodology.html">methodology</a>.
    </div>

    <footer class="footer">
      © <span id="year"></span> PsySymbol — RM Technologies LLC ·
      <a href="/about.html" class="muted">About</a> ·
      <a href="/methodology.html" class="muted">Methodology</a> ·
      <a href="/privacy.html" class="muted">Privacy</a> ·
      <a href="/terms.html" class="muted">Terms</a> ·
      <a href="/contact.html" class="muted">Contact</a>
    </footer>
  </div>

  <div id="consent-banner" hidden>
    <div class="inner">
      <p>We use cookies for analytics and ads. You can change your choices anytime.</p>
      <div class="actions">
        <button id="consent-accept" type="button">Accept all</button>
        <button id="consent-deny" type="button">Deny</button>
      </div>
    </div>
  </div>

  <script src="/app.js" defer></script>
</body>
</html>
`;
}

function repair(filePath, pillar) {
  let html = readFileSync(filePath, "utf8");

  if (html.includes('<script src="/app.js"')) return false;
  if (!html.includes('<main class="card">')) return false;

  // Find the last well-formed </p> — paragraph content past that point is mid-sentence garbage.
  const lastP = html.lastIndexOf("</p>");
  if (lastP === -1) return false;

  // Keep everything up to and including that </p>.
  let body = html.slice(0, lastP + 4);

  // Close any unclosed <section> tag (count opens vs closes after <main class="card">).
  const mainStart = body.indexOf('<main class="card">');
  const afterMain = body.slice(mainStart);
  const sectionOpens = (afterMain.match(/<section(\s[^>]*)?>/g) || []).length;
  const sectionCloses = (afterMain.match(/<\/section>/g) || []).length;
  const unclosed = sectionOpens - sectionCloses;
  for (let i = 0; i < unclosed; i++) body += "\n      </section>";

  body += closingBlock(pillar);
  writeFileSync(filePath, body, "utf8");
  return true;
}

let repaired = 0;
let already = 0;
for (const pillar of PILLARS) {
  const dir = resolve(DIST, pillar);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith(".html") && f !== "index.html");
  for (const f of files) {
    const ok = repair(resolve(dir, f), pillar);
    if (ok) repaired++; else already++;
  }
}

console.log(`Page repair: ${repaired} pages repaired, ${already} already-complete or skipped.`);
