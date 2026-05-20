// Content generation pipeline for PsySymbol.
// Uses Claude Opus 4.7 with prompt caching on the system prompt.
// Budget-capped: stops at MAX_USD spend (set via CLI arg or default $32 ~= £25).

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const MODEL = "claude-opus-4-7";
const MAX_USD = parseFloat(process.argv[2] ?? "32.00"); // ~£25 at current rate
const MAX_OUTPUT_TOKENS = 8000;
const CONCURRENCY = 5;

// Opus 4.7 pricing per 1M tokens (USD)
const PRICE_INPUT = 5.00;
const PRICE_INPUT_CACHE_WRITE = 6.25;
const PRICE_INPUT_CACHE_READ = 0.50;
const PRICE_OUTPUT = 25.00;

const systemPrompt = readFileSync(resolve(__dirname, "system-prompt.md"), "utf8");
const keywords = JSON.parse(readFileSync(resolve(__dirname, "keywords.json"), "utf8"));

// Load API key from scripts/.env (gitignored) if not already in environment.
const envPath = resolve(__dirname, ".env");
if (!process.env.ANTHROPIC_API_KEY && existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*"?([^"\s]+)"?\s*$/);
    if (m) {
      process.env.ANTHROPIC_API_KEY = m[1];
      break;
    }
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY not found.");
  console.error("Create scripts/.env with:  ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

let totalCostUSD = 0;
let pagesGenerated = 0;
let pagesSkipped = 0;
let pagesFailed = 0;
const startedAt = Date.now();

function costFromUsage(u) {
  return (
    ((u.input_tokens ?? 0) * PRICE_INPUT) / 1e6 +
    ((u.cache_creation_input_tokens ?? 0) * PRICE_INPUT_CACHE_WRITE) / 1e6 +
    ((u.cache_read_input_tokens ?? 0) * PRICE_INPUT_CACHE_READ) / 1e6 +
    ((u.output_tokens ?? 0) * PRICE_OUTPUT) / 1e6
  );
}

function userPromptFor(pillar, kw) {
  return `Generate the PsySymbol page for pillar=${pillar}, slug=${kw.slug}.

Context for this entry:
${kw.context}

Specific requirements:
- <title> tag: "${kw.title} — Meaning & Interpretation | PsySymbol"
- <h1>: ${kw.h1}
- canonical: https://psysymbol.com/${pillar}/${kw.slug}.html
- 4 distinct FAQ questions with substantive 2-3 sentence answers
- 6-9 specific variations
- 3 related interpretation links chosen from the existing PsySymbol slug list — pick ones that genuinely connect to this topic

Output the complete HTML document. Start with <!doctype html>. No prose around it.`;
}

async function generateOne(pillar, kw) {
  const outPath = resolve(DIST, pillar, `${kw.slug}.html`);

  if (existsSync(outPath)) {
    pagesSkipped++;
    return { pillar, slug: kw.slug, status: "skipped" };
  }

  if (totalCostUSD >= MAX_USD) {
    return { pillar, slug: kw.slug, status: "budget-cap" };
  }

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        { role: "user", content: userPromptFor(pillar, kw) },
      ],
    });

    const cost = costFromUsage(resp.usage);
    totalCostUSD += cost;

    const html = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!html.startsWith("<!doctype html>") && !html.startsWith("<!DOCTYPE html>")) {
      pagesFailed++;
      console.log(`  FAIL ${pillar}/${kw.slug} — did not start with doctype`);
      return { pillar, slug: kw.slug, status: "bad-format" };
    }

    // Guard against truncated output — page must contain the closing script tag,
    // otherwise it's missing the footer + scripts (Sprint 8 truncation defect).
    if (!html.includes('<script src="/app.js"') || !html.trim().endsWith("</html>")) {
      pagesFailed++;
      console.log(`  FAIL ${pillar}/${kw.slug} — truncated output (no closing block / </html>)`);
      return { pillar, slug: kw.slug, status: "truncated" };
    }

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, "utf8");

    pagesGenerated++;
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
    console.log(
      `  OK   ${pillar}/${kw.slug}  $${cost.toFixed(4)}  total=$${totalCostUSD.toFixed(2)}  pages=${pagesGenerated}  t=${elapsed}s`
    );
    return { pillar, slug: kw.slug, status: "ok", cost };
  } catch (err) {
    pagesFailed++;
    console.log(`  ERR  ${pillar}/${kw.slug} — ${err.message}`);
    return { pillar, slug: kw.slug, status: "error", error: err.message };
  }
}

async function runPool(tasks, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      if (totalCostUSD >= MAX_USD) return;
      const myIdx = idx++;
      results[myIdx] = await tasks[myIdx]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// Build task list — all pillars interleaved for balanced output.
const allTasks = [];
const maxLen = Math.max(keywords.dream.length, keywords.symbol.length, keywords.number.length);
for (let i = 0; i < maxLen; i++) {
  for (const pillar of ["dream", "symbol", "number"]) {
    const kw = keywords[pillar][i];
    if (kw) allTasks.push(() => generateOne(pillar, kw));
  }
}

console.log(`Pipeline starting. ${allTasks.length} keywords. Budget cap: $${MAX_USD.toFixed(2)}. Model: ${MODEL}.`);

await runPool(allTasks, CONCURRENCY);

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
console.log("");
console.log("=".repeat(60));
console.log(`Run complete. Elapsed: ${elapsed}s`);
console.log(`Pages generated: ${pagesGenerated}`);
console.log(`Pages skipped (already exist): ${pagesSkipped}`);
console.log(`Pages failed: ${pagesFailed}`);
console.log(`Total cost: $${totalCostUSD.toFixed(4)} (~£${(totalCostUSD * 0.78).toFixed(2)})`);
console.log(`Avg cost/page: $${(totalCostUSD / Math.max(pagesGenerated, 1)).toFixed(4)}`);
console.log("=".repeat(60));
