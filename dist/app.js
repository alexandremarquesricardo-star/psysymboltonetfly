// Landing-page script: JSON-LD, footer year, and consent-gated AdSense loader.
(() => {
  const CONSENT_KEY = 'psysymbol-consent';
  const ADSENSE_SRC =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3857946786580406';

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

  setYear();
  writeJsonLd();
  initConsent();
})();
