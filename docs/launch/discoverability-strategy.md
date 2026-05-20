# Discoverability strategy — PsySymbol

This is the single source of truth for how psysymbol.com gets discovered. Channels, status, blockers, sequencing.

## The picture

The site has 236 long-form interpretation pages. Editorially solid. Internally well-linked (~8 contextual links per page). Schema-complete (FAQPage + Article + BreadcrumbList + WebSite). Visually distinct (editorial-twilight palette). Monetization wired (AdSense consent-gated, Amazon affiliate shelf, Deep Read engagement hook). Static, served from Netlify.

**What's missing:** anyone finding it. The apex domain was parked at Sedo until DNS unblocks (see [[../../memory/dns_unblock_path.md]]). Until then, work compounds at zero in Google's eyes.

## Channels — current status and next move

### 1. Google Search (the long-term majority channel)

**Status:** Blocked until apex DNS resolves to Netlify. Once it does:
- Submit `sitemap.xml` to Google Search Console (verification file `googlee5f82bccb0a23ea8.html` already in place)
- Realistic first indexing: 2-8 weeks
- Realistic first ranking-relevant traffic: 3-6 months
- Realistic first £100/mo ad revenue: 4-9 months

**Leverage in our control once unblocked:**
- All 236 pages have full structured data (FAQPage + Article + BreadcrumbList)
- Internal linking density is ~8 links per page (well above the typical 3-link thin-site norm)
- HCU-safe: qualified language, cross-cultural depth, no template-repetition smell
- Canonical tags are correct, robots.txt is correct, sitemap is correct

### 2. Bing / Yandex / Naver via IndexNow

**Status:** Wired but dormant. Key file at `dist/bfd49b2104d7a9c20d44550ca364eeca.txt`. Script at `scripts/indexnow.mjs`.

**Fires automatically the moment DNS resolves.** Bing/Yandex/Naver/Seznam will pick up indexing requests within hours instead of weeks.

**Run command:** `node scripts/indexnow.mjs` — after every content batch.

**Realistic impact:** Bing is ~3% of global search but ~5-7% of US/UK desktop. Plus Yahoo (Bing-powered) and ChatGPT's web search (Bing-backed). Not huge, but free.

### 3. Pinterest

**Status:** 236 pin images generated (`dist/pins/{pillar}/{slug}.png`, 1000×1500). Catalogue at `dist/pins/index.json`.

**Why it matters:** Pinterest is the most under-priced discoverability channel for dream/symbol/numerology content. Visual, search-driven, low decay, no algorithm hostility toward new accounts. New pins get reach.

**Next moves (user action required — Pinterest account ownership):**
1. Create a Pinterest business account in the brand name "PsySymbol"
2. Create three boards: "Dream Meanings", "Spiritual Symbols", "Angel Numbers & Numerology"
3. Upload pins manually in batches of 5-10 per day to look organic (or wire the Pinterest API for automation once we have a token)
4. Description format per pin (auto-generated):
   - Title: "[Topic] — meaning & interpretation | PsySymbol"
   - Description: The first ~200 chars of the page's meta description, then the URL
   - Alt text: "[Topic] [pillar] meaning — PsySymbol" (already in catalogue)
5. Once 30+ pins uploaded across boards, rich-pin verification: claim the website (requires DNS resolved), then Pinterest pulls metadata automatically.

**Realistic timeline:** 30-60 days for first measurable referrer traffic. Pinterest pins have very long half-life (months-to-years vs days for Twitter).

### 4. Hacker News launch

**Status:** Draft at `docs/launch/hn-post.md`. **Do not fire until DNS resolves.**

**Why it matters:** One front-page-survival on HN drives 10K-50K visitors in 24h. Plus permanent ranking signal (HN posts are crawled and contribute to backlink graph). The "AI runs a real commercial site for 24 months" angle is HN-shaped — transparent, falsifiable, technical, low-hype.

**Fire window:** Tuesday/Wednesday, 8-10am UTC, the week after DNS resolves and the site has been live for ~48 hours (so visitors don't hit any cold-cache weirdness).

**Follow-ups committed:** Quarterly "X months in" posts. Each one buys another discoverability shot if revenue/progress is honestly reported.

### 5. Reddit organic

**Status:** Playbook at `docs/launch/reddit-playbook.md`. **Not yet started — needs a 30+ day account warm-up period before any posting.**

**Why it matters:** r/Jung (170K), r/dreams (250K), r/Numerology (50K) are dense with our exact audience. Indexed by Google too — Reddit posts often outrank dedicated SEO sites for niche queries.

**The 90/10 rule:** 90% value-first, no-link contribution; 10% in-comment link drops as supplement to a full direct answer. Promotional content is instant-ban material in these subs.

**Realistic timeline:** First measurable referrer traffic in month 2-3, modest sustained traffic from month 4 onward.

### 6. YouTube Shorts (designed, not built)

**Status:** Concept only.

**The play:** Each of the 236 pages becomes a 30-60 sec narrated short. TTS narration over a slow Ken Burns pan of the corresponding Pinterest pin, with caption overlay. Description links to the article. Series naming: "Dream Meanings: [Topic]" / "Symbol Meanings: [Topic]" / "Numerology: [Number]".

**Tooling stack (when ready to build):**
- Narration: ElevenLabs (paid, ~$0.30/short) or open-source Piper (free, lower quality)
- Visual: ffmpeg slow zoom on existing 1000×1500 pin, scaled to 1080×1920
- Caption: synchronized with TTS markers (requires SRT generation from TTS API)
- Upload: YouTube Data API v3, or manual to start

**Cost ballpark:** ~$70 for ElevenLabs narration of full corpus. Build time: ~6-10 hours.

**Defer until:** after Pinterest results give signal (month 2-3). YouTube is high-effort and lower probability than Pinterest for this niche.

### 7. The PR / narrative angle (highest single-shot leverage)

The public-bet narrative — "AI runs a real commercial site for 24 months" — is the single highest-leverage discoverability lever available because it's a *story*, not just SEO. Story-driven discovery has no compounding decay.

**Channels for the story (after DNS unblocks):**
- Hacker News (primary, see above)
- Indie Hackers — cross-post same-day, 30 mins after HN
- r/SideProject, r/Entrepreneur — cross-post same-day
- Personal Twitter/X (if user has one)
- Direct outreach to tech newsletter operators (TLDR, Hacker Newsletter, Tools And Toys, etc.) — pitch the experiment, link the live numbers

**Quarterly drumbeat:** "Month 3 update," "Month 6 update," etc. Each one earns a fresh HN attempt and Twitter/X buzz if numbers are interesting (positive or negative — losing publicly is also content).

### 8. Backlinks (slow but cumulative)

- **DuckDuckGo / Mojeek / Brave Search** — submit URLs via their respective webmaster tools (some require ownership verification). Low-volume but easy.
- **Web archive (archive.org)** — submit homepage + a few canonical pages to the Wayback Machine. Signals permanence to crawlers.
- **Niche directories** — most dream-interpretation directories are dead or SEO-spam. Skip unless one ranks well organically itself.
- **Wikipedia citations** — only if our page genuinely adds reference value on an existing article (e.g., a specific Jungian reading we cover better than current sources). Rare but valuable. Insta-banned if it reads as self-promotion.
- **Mastodon `<link rel="me">`** — once user creates a Mastodon account, add it to the homepage `<head>`. Small signal but free.

### 9. Email newsletter (Resend, blocked on DNS)

**Status:** Account exists, API key not provided yet. DNS records (SPF/DKIM/DMARC) not yet added at name.com.

**Plan:** Daily symbol/dream newsletter — single page, one editorial pick per day. Reaches subscribers directly (no algorithm in the way). Long-term compounds into a meaningful audience.

**Realistic curve:** zero subscribers at launch. Even with everything else firing, expect <500 subscribers at month 6, ~2-3K by month 18. The value isn't traffic — it's retention.

### 10. Multilingual rollout (Phase 3 per [[../../memory/decision_multilingual.md]])

**Status:** Decision locked. Not yet built.

**Play:** 11 languages at Phase 3 (PT-BR and PT-PT as separate markets), expanding to 18 by month 12. Each language ~= a fresh corpus indexable in its own search market. PT-BR is the user's only explicit feature request.

**When:** After DNS resolves, after first language (English) shows baseline indexing and traffic signal (~month 3). Then phase in.

**Cost:** ~£0.07/page × 236 pages × 10 additional languages = ~£165 generation cost per language pack. Cultural transcreation, not translation — system prompt explicitly handles this.

## Sequencing — what comes next

The single bottleneck is DNS. Until apex resolves:
1. **No Google indexing happens.** All SEO work compounds at zero.
2. **No GSC verification.** No indexing dashboard.
3. **No IndexNow firing.** Bing/Yandex won't validate key file.
4. **No AdSense impressions.** No revenue.
5. **No Resend domain verification.** No newsletter.
6. **No HN fire.** Sending traffic to a parked domain is a wasted shot.

**The only DNS-independent work right now:** Pinterest account setup (user action) + content pipeline expansion (toward the 2000-page target).

**Once DNS resolves**, all the above unblocks in a 2-hour sequence:
1. Submit sitemap to GSC
2. Run `node scripts/indexnow.mjs`
3. Verify Bing Webmaster
4. Verify Resend domain
5. Re-apply for AdSense
6. Schedule HN fire for the next Tuesday morning UTC

## How to read this doc going forward

Update the per-channel status as moves happen. Quarterly, snapshot the doc + revenue numbers into a dated archive (e.g., `docs/launch/snapshot-2026-08-20.md`) so the experiment has a real audit trail.
