// Landing-page script: JSON-LD, footer year, consent-gated AdSense, Deep Read.
(() => {
  const CONSENT_KEY = 'psysymbol-consent';
  const ADSENSE_SRC =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3857946786580406';

  // ---------- Year + JSON-LD ----------
  function setYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function writeJsonLd() {
    const el = document.getElementById('psysymbol-ld');
    if (!el) return;
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PsySymbol',
      url: 'https://psysymbol.com/',
      publisher: {
        '@type': 'Organization',
        name: 'RM Technologies LLC',
        url: 'https://psysymbol.com/',
      },
    });
  }

  // ---------- Consent banner + AdSense ----------
  function showBanner(show) {
    const el = document.getElementById('consent-banner');
    if (el) el.hidden = !show;
  }

  function loadAdSense() {
    if (document.querySelector('script[src*="googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = ADSENSE_SRC;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function pushAds() {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }

  function applyConsent(granted) {
    localStorage.setItem(CONSENT_KEY, granted ? 'yes' : 'no');
    showBanner(false);
    if (granted) {
      loadAdSense();
      setTimeout(pushAds, 250);
    }
  }

  function initConsent() {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'yes') return applyConsent(true);
    if (stored === 'no') return applyConsent(false);
    showBanner(true);
    document.getElementById('consent-accept')?.addEventListener('click', () => applyConsent(true));
    document.getElementById('consent-deny')?.addEventListener('click', () => applyConsent(false));
  }

  // ---------- Deep Read ----------
  function detectInterpretation() {
    const m = location.pathname.match(/^\/(dream|symbol|number)\/([a-z0-9-]+)\.html$/);
    if (!m) return null;
    const [, mode, slug] = m;
    if (slug === 'index') return null;
    const topic = slug.replace(/-/g, ' ');
    return { mode, topic };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function injectDeepRead(meta) {
    const main = document.querySelector('main.card');
    if (!main) return;

    const wrap = document.createElement('section');
    wrap.className = 'deep-read';
    wrap.innerHTML = `
      <h2>Want a personalised Deep Read of ${escapeHtml(meta.topic)}?</h2>
      <p class="muted">The page above is the common reading. The Deep Read is the upgrade — a fresh interpretation written for you, optionally tailored to anything specific about your experience. Powered by Claude Haiku.</p>
      <button class="deep-read__trigger" type="button">Get a Deep Read</button>
      <div class="deep-read__panel" hidden>
        <label class="deep-read__label" for="deep-read-context">Anything specific about your experience? <span class="muted">(optional)</span></label>
        <textarea id="deep-read-context" class="deep-read__context" rows="3" maxlength="2000" placeholder="e.g. I keep seeing this dream the night before stressful meetings"></textarea>
        <div class="deep-read__actions">
          <button class="deep-read__submit" type="button">Generate Deep Read</button>
          <span class="muted deep-read__limit">~5 free Deep Reads per day · nothing is saved</span>
        </div>
        <div class="deep-read__output" hidden></div>
      </div>
    `;

    main.after(wrap);

    const trigger = wrap.querySelector('.deep-read__trigger');
    const panel = wrap.querySelector('.deep-read__panel');
    const submit = wrap.querySelector('.deep-read__submit');
    const context = wrap.querySelector('.deep-read__context');
    const output = wrap.querySelector('.deep-read__output');

    trigger.addEventListener('click', () => {
      panel.hidden = false;
      trigger.hidden = true;
      context.focus();
    });

    submit.addEventListener('click', () => {
      runDeepRead({ ...meta, text: context.value }, submit, output);
    });
  }

  async function runDeepRead(payload, submitBtn, outputEl) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating…';
    outputEl.hidden = false;
    outputEl.textContent = '';
    outputEl.classList.remove('deep-read__output--error');

    try {
      const resp = await fetch('/api/deep-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });

        const events = buf.split('\n\n');
        buf = events.pop() ?? '';

        for (const ev of events) {
          if (!ev.startsWith('data: ')) continue;
          const raw = ev.slice(6).trim();
          if (raw === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              outputEl.textContent += parsed.text;
            } else if (parsed.error) {
              outputEl.textContent = parsed.error;
              outputEl.classList.add('deep-read__output--error');
              done = true; break;
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      outputEl.textContent = 'Something went wrong reaching the Deep Read service. Please try again in a moment.';
      outputEl.classList.add('deep-read__output--error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate another';
    }
  }

  function initDeepRead() {
    const meta = detectInterpretation();
    if (meta) injectDeepRead(meta);
  }

  // ---------- Amazon affiliate shelf ----------
  const AFFILIATE_TAG = 'psysymbol-21';
  const BOOK_PICKS = {
    dream: [
      { title: 'Man and His Symbols', author: 'Carl Jung', q: 'man and his symbols jung' },
      { title: 'Inner Work', author: 'Robert A. Johnson', q: 'inner work robert johnson dreams' },
      { title: 'The Interpretation of Dreams', author: 'Sigmund Freud', q: 'interpretation of dreams freud' },
    ],
    symbol: [
      { title: 'The Book of Symbols', author: 'ARAS / Taschen', q: 'book of symbols taschen aras' },
      { title: 'A Dictionary of Symbols', author: 'J. E. Cirlot', q: 'dictionary of symbols cirlot' },
      { title: 'Man and His Symbols', author: 'Carl Jung', q: 'man and his symbols jung' },
    ],
    number: [
      { title: 'The Complete Book of Numerology', author: 'David A. Phillips', q: 'complete book of numerology david phillips' },
      { title: 'Numerology and the Divine Triangle', author: 'Faith Javane', q: 'numerology divine triangle javane' },
      { title: 'Angel Numbers', author: 'Kyle Gray', q: 'angel numbers kyle gray' },
    ],
  };

  function amazonURL(query) {
    return `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
  }

  function injectAmazonShelf(mode) {
    const picks = BOOK_PICKS[mode];
    if (!picks) return;
    const anchor =
      document.querySelector('.deep-read') ||
      document.querySelector('main.card');
    if (!anchor) return;

    const shelf = document.createElement('section');
    shelf.className = 'reading-shelf';
    shelf.innerHTML = `
      <h2>Related reading</h2>
      <p class="muted">If you want to go deeper than any single page can, these are the books we keep returning to.</p>
      <div class="reading-shelf__items">
        ${picks.map(p => `
          <a class="reading-shelf__item" href="${amazonURL(p.q)}" target="_blank" rel="sponsored noopener">
            <div class="reading-shelf__title">${escapeHtml(p.title)}</div>
            <div class="reading-shelf__author muted">${escapeHtml(p.author)}</div>
          </a>
        `).join('')}
      </div>
      <p class="reading-shelf__disclosure">As an Amazon Associate we earn from qualifying purchases at no cost to you. Links open Amazon UK in a new tab. See our <a href="/privacy.html#affiliates">affiliate disclosure</a>.</p>
    `;
    anchor.after(shelf);
  }

  function initAmazonShelf() {
    const meta = detectInterpretation();
    if (meta) injectAmazonShelf(meta.mode);
  }

  // ---------- Boot ----------
  setYear();
  writeJsonLd();
  initConsent();
  initDeepRead();
  initAmazonShelf();
})();
