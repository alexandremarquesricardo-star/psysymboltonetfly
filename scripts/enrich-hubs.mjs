// Hub-page enrichment: adds a substantive intro essay + FAQ + FAQPage JSON-LD
// to /dream/index.html, /symbol/index.html, /number/index.html.
//
// Idempotent via markers. Hub featured-card sections are left untouched.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const MARKER_INTRO_START = "<!-- hub:intro -->";
const MARKER_INTRO_END = "<!-- /hub:intro -->";
const MARKER_FAQ_START = "<!-- hub:faq -->";
const MARKER_FAQ_END = "<!-- /hub:faq -->";
const MARKER_SCHEMA_START = "<!-- hub:faq-schema -->";
const MARKER_SCHEMA_END = "<!-- /hub:faq-schema -->";

const META_DESC = {
  dream: "Dream meanings and interpretations drawn from Jungian depth psychology, comparative symbolism, and cross-cultural traditions. 80+ long-form readings of common dream themes — snakes, falling, water, death, being chased, and more.",
  symbol: "Symbol meanings across Jungian, Egyptian, Celtic, Hindu, Buddhist, and Western esoteric traditions. 79+ long-form readings of the most recognised symbols — the owl, the lotus, the ouroboros, the Eye of Horus, and many more.",
  number: "Angel numbers, repeating sequences, and numerology meanings — qualified readings drawn from Pythagorean numerology, Kabbalistic gematria, and the modern angel-number framework. 77+ long-form pages on 111, 222, 333, 444, 555, 666, 777, 888, 999, 1111, and the mirror sequences.",
};

const INTROS = {
  dream: `      <section class="hub-intro">
        <p>Dreams are the brain's nightly work of metabolising the day — taking the feelings, fragments, and unresolved questions of waking life and rendering them into images. Most traditions that take dream interpretation seriously, from Freud and Jung through the comparative-religion scholarship of Eliade and Hillman, share one principle: <strong>a dream is not a literal report or a prediction, but a symbolic dramatisation of something already true in you that hasn't been seen</strong>.</p>
        <p>That's the lens these pages work from. Each interpretation treats the dream as a recognition, not an oracle. A dream about teeth falling out isn't a warning about teeth — it's the body holding the recognition that you've been afraid of how something would come across, that words you said felt lossy, that the rendering of yourself to the world feels less secure than it did. A dream about being chased isn't about a literal pursuer — it's the avoidance pattern in your life made visible.</p>
        <p>We draw on several traditions in parallel: <strong>Jungian depth psychology</strong> for the structural patterns (archetypes, shadow material, the individuation arc); <strong>Freudian and post-Freudian</strong> work where it adds clarity around defence and desire; <strong>cross-cultural symbolism</strong> (Egyptian, Indian, Celtic, Indigenous, ancient Greek dream-reading) where it shows what a particular image has consistently meant to people who took it seriously; and <strong>contemporary neuropsychology</strong> of REM sleep where it grounds the symbolic in the somatic.</p>
        <p>The pages don't predict and don't reassure. They qualify, offer alternative readings, tell you what the image has signalled to people across time and contexts, and leave the interpretation to you — because the dream is yours, and only you know what specific waking situation it might be rendering. The shape of these readings is closer to a thoughtful friend who's read widely than to a fortune-teller.</p>
        <p>Each interpretation page is 1,500–2,500 words, structured the same way: the core reading, common variations, cross-cultural notes where they matter, the Jungian/shadow frame, a reflective practice if appropriate, and answered FAQs. Every page ends with a <strong>Get a Deep Read</strong> button — a fresh personalised interpretation tailored to whatever specific detail you want to share, written for the moment, not stored.</p>
      </section>`,
  symbol: `      <section class="hub-intro">
        <p>Symbols are older than language and older than writing. They are the way the psyche communicates with itself when an idea is too large, too charged, or too contradictory to be said in words. Every culture that has lasted has accumulated symbols — geometric, animal, plant, celestial, mythic — and the ones that survive across centuries do so because <strong>they keep meaning something to new people in new contexts</strong>.</p>
        <p>Symbol interpretation, done seriously, is not the assigning of a fixed meaning to an image. It's the practice of listening to what an image is doing in a specific tradition, a specific moment, and a specific person's life. The owl is not "wisdom" in any flat sense — the owl was death's messenger in some Mesopotamian traditions, Athena's companion in Athens, a bad omen in some Indian villages, a guide in Native American traditions, and a Harry-Potter delivery animal in contemporary children's fiction. All of those readings are real; what the owl means to you in a moment of seeing one depends on which of those resonances activates.</p>
        <p>These pages work the way the dream pages do: they qualify, cross-reference traditions, offer the Jungian and the cultural lens in parallel, tell you the shadow side and the generative side, and leave the meaning to you. A symbol that turned up in a dream, a tattoo decision, a place you travelled to, or a recurring synchronicity is best read with breadth rather than certainty.</p>
        <p>We draw most heavily on <strong>J.E. Cirlot's Dictionary of Symbols</strong>, the <strong>ARAS / Taschen Book of Symbols</strong> (the deepest single reference in print on cross-cultural symbol meaning), <strong>Jung's Man and His Symbols</strong>, comparative mythology (Joseph Campbell, Mircea Eliade), and the original sources where the tradition is alive — Egyptian hieroglyphic context for ankh and Eye of Horus, Hindu and Buddhist sources for the lotus and the chakras, Celtic sources for the trinity knot and Tree of Life, and so on.</p>
        <p>Each interpretation page is treated as a long-form essay rather than a one-line gloss. Every page ends with a <strong>Get a Deep Read</strong> button — a fresh personalised interpretation written for the moment if the templated reading doesn't quite match what you're sitting with.</p>
      </section>`,
  number: `      <section class="hub-intro">
        <p>The interpretation of numbers — angel numbers, life-path numbers, repeating sequences seen in clocks and license plates and receipts — is the youngest of the three traditions we cover here. The modern angel-number movement is roughly a century old (Doreen Virtue's <em>Messages from Your Angels</em> series in the 2000s made the framework mainstream), though it draws on <strong>numerology that goes back to Pythagoras in the 6th century BC</strong> and on <strong>Hebrew gematria</strong> (the practice of reading numerical value into words) older than that.</p>
        <p>What makes the interpretation of numbers different from dream and symbol work is that <strong>you can't really argue with the pattern</strong>. If you're seeing 11:11 on the clock several times a week and again on a receipt and again on a doorplate, something is happening — either a real psychological frequency-illusion is making you notice these patterns more than chance would suggest (which is itself meaningful: your attention is hunting for something), or the pattern itself is signal. The interpretation work is to ask: signal of what? What part of you is being asked to pay attention?</p>
        <p>Our number pages work from several traditions in parallel. The <strong>modern angel-number framework</strong> (Doreen Virtue, Kyle Gray's <em>Angel Numbers</em>, the broader contemporary numerology community) for the popular vocabulary — 444 as protection, 333 as creative flow, 1111 as alignment, and so on. <strong>Pythagorean numerology</strong> for the structural roots — what 1 means as initiation, 2 as polarity, 7 as the inner-spiritual, 9 as completion. <strong>Hebrew gematria</strong> where it adds resonance. The <strong>Western esoteric tradition</strong> (Tarot's numerological correspondences, the Sephirot in Kabbalah) where it deepens the picture.</p>
        <p>What we don't do is predict. A number isn't a forecast. It's a frequency you've started noticing — and the asking is what it's drawing your attention toward. Sometimes that's a stage of life transition. Sometimes it's a reminder of a value you've been neglecting. Sometimes it's coincidence amplified by selective attention. The number itself doesn't determine which.</p>
        <p>Below are the master numbers (111, 222, 333, 444, 555, 666, 777, 888, 999, 1111, 1212), the mirror sequences (121, 232, 343…), and the major sequences (1234). Each is treated as an essay rather than a dictionary entry. Every page ends with a <strong>Get a Deep Read</strong> button if you want a fresh personalised take.</p>
      </section>`,
};

const FAQS = {
  dream: [
    {
      q: "What do most dreams actually mean?",
      a: "Most dreams are the brain's overnight processing of the day's emotional residue — fragments of recent conversations, unresolved tensions, things you noticed but didn't consciously register. They are symbolic rather than literal. A useful working assumption: a dream is not telling you what will happen, it's showing you what already is, in a register the conscious mind hasn't yet acknowledged.",
    },
    {
      q: "Is there a 'dream dictionary' that gives reliable meanings?",
      a: "Not in the one-image-one-meaning sense. The dream traditions that have lasted — Jungian, Freudian, the major cross-cultural ones — all agree that the same image can carry very different meanings depending on who is dreaming it, where they are in life, and what the dream's emotional tone was. Our pages give you the range of readings a symbol has carried, then leave the specific interpretation to you.",
    },
    {
      q: "Why do I keep having the same dream?",
      a: "Recurring dreams almost always mark an unresolved situation in waking life. The psyche keeps returning to the same image because the question it's asking hasn't been answered. The recurrence itself is the signal — and the variation between recurrences (small differences in the dream's setting, characters, ending) often points at where the dream is asking you to look.",
    },
    {
      q: "Are nightmares meaningful, or just random?",
      a: "Nightmares are rarely random. Most depth-psychology traditions read them as the psyche's pressure-release valve for material that is too charged to surface in waking awareness. Repeating nightmares often correspond to unprocessed grief, fear, or trauma. If they are persistent and affecting sleep, that's a sign to talk to a therapist as well as to read symbolically.",
    },
    {
      q: "Can a dream predict the future?",
      a: "Almost never in the literal sense. Dreams that seem to predict events are usually the dreamer's intuition catching up with information the conscious mind hadn't yet processed — patterns in a relationship, signs in someone's behaviour, a sense that something was off. The dream rendered the recognition. The 'future' it showed was already underway in waking life.",
    },
  ],
  symbol: [
    {
      q: "How do you tell what a symbol 'really' means when different traditions disagree?",
      a: "You don't pick one tradition and call it true. The work is to hold the range — to know that the owl is a wisdom-figure in Athens and a death-omen in some Indian villages, and to listen to which of those readings is alive for the specific person, in the specific moment, encountering the symbol. The interpretation that matters is the one that resonates against what's actually happening in your life.",
    },
    {
      q: "Are symbols the same as archetypes?",
      a: "Closely related but not identical. An archetype, in Jung's sense, is a structural pattern in the psyche — the mother, the hero, the trickster, the shadow. A symbol is the specific image that carries that archetype in a given culture. The same archetype of the wise feminine can appear as Athena, Sophia, Quan Yin, the Virgin Mary, the Crone — different symbols, shared archetypal ground.",
    },
    {
      q: "Why do certain symbols keep appearing in my life?",
      a: "Either your attention is hunting for them (which is itself meaningful — what is the symbol responding to?), or the symbol is genuinely present in your life and you've started to notice. Both readings are useful. The question to ask is not 'is this random or real?' but 'what is the symbol pointing at in my present circumstances?'",
    },
    {
      q: "Can I wear or use a symbol from a tradition that isn't mine?",
      a: "Depends on the symbol and the tradition. Some symbols are closed — the Hamsa from Jewish tradition, certain Indigenous symbols, sacred Buddhist imagery used as decoration — and using them without context can be appropriative. Others (the lotus, the cross, the ankh, the yin-yang) have moved freely between cultures for centuries. The honest read is to know the source and the current sensitivities, then decide.",
    },
    {
      q: "What's the difference between a personal symbol and a universal one?",
      a: "A universal symbol carries shared meaning across many cultures and time periods — the snake, the moon, the tree, the circle. A personal symbol carries meaning only inside one person's life — your grandmother's pearl earrings, the route you walked to school, a specific song. Both can appear in dreams and visions. Interpretation work usually has to do both at once: place the image in its universal context, then ask what it specifically means to you.",
    },
  ],
  number: [
    {
      q: "Are angel numbers real?",
      a: "Real in the sense that the experience of seeing them is genuine and consistent across many people. The harder question is what causes them. The modern angel-number framework treats them as guidance from non-physical sources. A more psychologically grounded reading treats them as cases of meaningful selective attention — your psyche is hunting for a pattern, and the pattern it finds is itself meaningful, regardless of what's driving the hunt.",
    },
    {
      q: "Why do I keep seeing 11:11?",
      a: "11:11 is the most-reported repeating sequence in modern angel-number culture, partly because of its visual prominence on digital clocks and partly because of the symbolic weight of 1 (initiation, beginning, alignment) appearing four times. Traditions that take it seriously read it as a moment of alignment — your attention, your intention, and the moment have all converged. It often surfaces during periods of transition.",
    },
    {
      q: "What's the difference between numerology and angel numbers?",
      a: "Numerology is the older tradition — Pythagorean, gematric, esoteric — that assigns meaning to numbers based on structural and arithmetic relationships. Angel numbers are the contemporary popular framework that names specific sequences (444, 333, 1111) as messages from non-physical sources. Most modern readings draw on both: angel numbers give you the popular vocabulary, numerology gives you the structural depth underneath.",
    },
    {
      q: "Do specific numbers actually mean specific things?",
      a: "There is real cross-tradition consistency. 7 has been the 'inner-spiritual' number from Pythagorean numerology through Christian theology through Kabbalah. 3 has been completion / triadic structure across most ancient traditions. 4 has been earthly grounding (four elements, four directions, four seasons) almost universally. The popular angel-number readings tend to layer on top of these older structural meanings rather than replacing them.",
    },
    {
      q: "How is this different from astrology?",
      a: "Astrology reads meaning from the positions of celestial bodies at a specific moment in time, treating the birth chart (or transit chart) as a kind of psychological topology. Numerology reads meaning from the numerical structure of a name, a date, or a moment — and treats specific numerical patterns as carriers of meaning. Both are symbolic systems. Many people use them together. They are not the same practice.",
    },
  ],
};

function buildIntroBlock(pillar) {
  return [MARKER_INTRO_START, INTROS[pillar], MARKER_INTRO_END].join("\n");
}

function buildFaqBlock(pillar) {
  const items = FAQS[pillar].map(({ q, a }, i) => `        <details${i === 0 ? " open" : ""}>
          <summary>${escapeHtml(q)}</summary>
          <p>${escapeHtml(a)}</p>
        </details>`).join("\n");

  return [
    MARKER_FAQ_START,
    `      <section class="hub-faq" style="margin-top:32px">`,
    `        <h2>Common questions</h2>`,
    items,
    `      </section>`,
    MARKER_FAQ_END,
  ].join("\n");
}

function buildSchemaBlock(pillar) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS[pillar].map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return [
    MARKER_SCHEMA_START,
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    MARKER_SCHEMA_END,
  ].join("\n");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function enrich(pillar) {
  const filePath = resolve(DIST, pillar, "index.html");
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ ${pillar}/index.html not found`);
    return false;
  }

  let html = readFileSync(filePath, "utf8");

  // 1) Replace meta description.
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${META_DESC[pillar]}" />`
  );

  // 2) Inject intro after the lede `<p class="muted">` (just below the h1).
  const introBlock = buildIntroBlock(pillar);
  const introRe = new RegExp(`${MARKER_INTRO_START}[\\s\\S]*?${MARKER_INTRO_END}`);
  if (introRe.test(html)) {
    html = html.replace(introRe, introBlock);
  } else {
    // Insert after the first `<p class="muted">...</p>` inside main.card.
    html = html.replace(
      /(<p class="muted">[\s\S]*?<\/p>)/,
      `$1\n\n${introBlock}`
    );
  }

  // 3) Inject FAQ section before `</main>` (or before the disclaimer if no </main>).
  const faqBlock = buildFaqBlock(pillar);
  const faqRe = new RegExp(`${MARKER_FAQ_START}[\\s\\S]*?${MARKER_FAQ_END}`);
  if (faqRe.test(html)) {
    html = html.replace(faqRe, faqBlock);
  } else if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${faqBlock}\n    </main>`);
  } else {
    // Fallback: insert before the disclaimer div.
    html = html.replace(/<div class="disclaimer"/, `${faqBlock}\n\n    <div class="disclaimer"`);
  }

  // 4) Inject FAQPage JSON-LD before </head>.
  const schemaBlock = buildSchemaBlock(pillar);
  const schemaRe = new RegExp(`${MARKER_SCHEMA_START}[\\s\\S]*?${MARKER_SCHEMA_END}`);
  if (schemaRe.test(html)) {
    html = html.replace(schemaRe, schemaBlock);
  } else {
    html = html.replace(/<\/head>/i, `${schemaBlock}\n</head>`);
  }

  writeFileSync(filePath, html, "utf8");
  return true;
}

let count = 0;
for (const pillar of ["dream", "symbol", "number"]) {
  if (enrich(pillar)) count++;
}
console.log(`Hub enrichment: ${count} hubs updated.`);
