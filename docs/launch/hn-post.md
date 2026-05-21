# Hacker News launch post — PsySymbol (draft)

**Status:** Ready. `psysymbol.com` is live (350 pages, HTTPS, Cloudflare DNS in front of Netlify). Fire after ~48h of stable live traffic — pick the next Tue/Wed 8–10am UTC. Re-check the page count in the body if more content ships before firing.

**Pre-flight checklist before firing:**

- [ ] `curl -sI https://psysymbol.com/` returns `Server: Netlify` (not `Server: Parking/1.0`)
- [ ] Sitemap submitted to Google Search Console
- [ ] AdSense status verified (won't matter for HN traffic itself, but post-HN spillover to the next 30 days is when ad revenue compounds)
- [ ] Read through site as a first-time visitor on mobile — fix anything embarrassing
- [ ] Have an answer ready for: "What's the prompt? What's the system prompt?"
- [ ] Have an answer ready for: "How do you stop Google from de-ranking this as AI slop?"
- [ ] Have an answer ready for: "What if Claude just generates 10,000 pages of garbage?"

---

## Title options (ranked)

1. **Show HN: I'm letting Claude run psysymbol.com for 24 months as a public bet**
2. Show HN: PsySymbol – an AI agent is the lead developer, designer, and operator (2-year experiment)
3. Show HN: AI vs human operator – running a real commercial site for 24 months, public scoreboard

## Body

I bought psysymbol.com a while ago. On 2026-05-17 I handed it over.

For the next 24 months — until 2028-05-17 — Claude is the lead developer, designer, SEO strategist, content writer, and operator of the site. I own the credentials (domain registrar, Stripe, AdSense, Anthropic API key) and that's it. Every product decision, every line of code, every page of content, every marketing move is the model's call. I don't suggest features. I top up balances.

The bet is simple: can an AI agent operating with real autonomy beat a human running the same site? The site is a dream / symbol / number interpretation library — a tractable, ad-and-affiliate-monetizable niche with enough volume to produce signal, low enough stakes that running it solo as an experiment is feasible.

**Public targets (worldwide, base case):** £55K–£130K cumulative revenue by 2028-05-17. Point estimate £75K. If it lands below £20K I'll call it: AI couldn't beat a competent human operator at this. If it lands above £200K, the inverse.

**What's live right now:** 350 long-form interpretation pages (50 hand-written by Claude in a single working session, 300 generated via a Claude Opus 4.7 pipeline at ~£0.11/page). Editorial template codifies a qualified-voice, cross-cultural, Jungian-aware register — written to be helpful, not search-spammy. Every page is between 1,500–2,500 words. There's also a per-page "Deep Read" — a runtime, rate-limited Claude Haiku call that writes a fresh personalised interpretation on demand. Static site, no database, served from Netlify behind Cloudflare DNS. Total infra cost so far: domain (£10) + Anthropic API spend (~£25).

**Where the friction has actually been:** not the code. The apex domain sat parked at Sedo for days behind a registrar/DNS tangle; clearing it took a support ticket and ultimately migrating DNS to Cloudflare — and that migration silently re-imported the old parking records, briefly flapping the live site between the real pages and a parking page until it was caught and cleaned up. Half the lessons of this experiment so far are about how operational friction, not the model's output, blocks technically-finished work.

**Why in public:** the only honest test is one where I can't quietly bury the result. The repo is public. Revenue will be posted quarterly with the underlying numbers.

**Source code:** github.com/alexandremarquesricardo-star/psysymboltonetfly
**Live site:** psysymbol.com

**What I'd value from HN:** harsh critique of the SEO posture, the editorial template, the monetization mix. Not encouragement. The point is to compress 24 months of operator learning into something testable.

---

## When to fire

- **Day of week:** Tuesday or Wednesday, 8-10am UTC (best HN front-page-survival odds for a slow-burn topic post)
- **Avoid:** Friday afternoon UTC (weekend dead zone), Monday morning UTC (drowned by AGI / Apple / OpenAI news)
- **Cross-post 30 minutes later to:** Indie Hackers, r/SideProject, r/Entrepreneur. Avoid r/programming (HN-hostile crossover).
- **Don't ask friends to upvote.** HN shadow-detects this and buries the post.

## Comment-day playbook

- Be on the post for 6 hours after firing. Answer every top-level comment within 30 minutes.
- Lead every reply with the literal answer, not framing.
- Concede points generously when commenters are right. HN rewards honest concession with continued engagement.
- Never reply defensively. The post is "here's a thing I'm doing, tell me what's wrong with it." Stay in that posture.

## Follow-up posts (months 3, 6, 12, 18, 24)

- Pre-commit to a quarterly "Show HN: 3 months in — here's what's working and what isn't" follow-up. Same transparent format. Each one buys a fresh discoverability shot.
