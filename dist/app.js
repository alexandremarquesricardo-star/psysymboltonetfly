
// -------------------- Content data --------------------
const SAMPLES = {
  dreams: ["black cat dream","losing teeth","flying","being chased","ocean waves","snake in bed"],
  symbols: ["black cat","butterfly","white feather","raven","lotus","owl","key","mirror"],
  numbers: ["111","222","333","444","555","777","1010","1212"]
};
const RELATED = ["intuition","transformation","protection","rebirth","balance","shadow work","synchronicity","clarity","boundaries"];

// -------------------- Utils --------------------
function titleCase(s){return s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()).replace(/\s+/g," ").trim()}

function prng(seedStr){
  let h = 2166136261>>>0;
  for(let i=0;i<seedStr.length;i++) h=Math.imul(h ^ seedStr.charCodeAt(i),16777619);
  return ()=> (h = Math.imul(h ^ (h>>>15),2246822507), ((h ^ (h>>>13))>>>0)/2**32);
}

// -------------------- Generator --------------------
function makeSections(topic, mode){
  const r = prng(mode+":"+topic.toLowerCase());
  const tones = ["psychological","spiritual","symbolic","mythic","practical","archetypal"];
  const tone = tones[Math.floor(r()*tones.length)];
  const base = titleCase(topic);
  const h2 = mode==="dreams"? `${base} — Dream Meaning` : (mode==="symbols"? `${base} — Symbolism & Meaning` : `${base} — Number Meaning`);
  const short = [
    `${base} often points to ${r()<0.5? "inner shifts":"heightened intuition"}.`,
    `Many associate ${base.toLowerCase()} with ${r()<0.5? "protection":"transformation"}.`,
    `In a ${tone} lens, ${base.toLowerCase()} highlights ${r()<0.5? "clarity":"shadow integration"}.`
  ];
  const bullets = [
    `${r()<0.5? "Growth":"Change"} is unfolding beneath the surface`,
    `A nudge to trust your ${r()<0.5? "intuition":"process"}`,
    `${r()<0.5? "Release":"Set"} old patterns and ${r()<0.5? "welcome":"protect"} your energy`,
    `Watch for repeating synchronicities around this theme`
  ];
  const scenarios = [
    `You notice ${base.toLowerCase()} during a decision crossroads`,
    `${base} appears after a conversation that stirred emotions`,
    `You see ${base.toLowerCase()} repeatedly in a short time window`,
    `A dream featuring ${base.toLowerCase()} recurs three nights in a row`
  ];
  const prompts = [
    `What feels ready to change when ${base.toLowerCase()} shows up?`,
    `Where is my energy asking for clearer boundaries?`,
    `What synchronicities are clustering around this theme?`
  ];
  const cautions = [
    `Avoid fatalistic thinking — context matters more than single symbols.`,
    `Meanings are guides, not rules. Your lived experience leads.`
  ];
  const related = Array.from({length:4},()=> RELATED[Math.floor(r()*RELATED.length)]).filter((v,i,a)=>a.indexOf(v)===i);
  return {h2, excerpt: short[Math.floor(r()*short.length)], bullets, scenarios, prompts, cautions, related};
}

// -------------------- Rendering --------------------
let adTimer;
function safePushAds() {
  clearTimeout(adTimer);
  adTimer = setTimeout(()=> {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
  }, 150);
}

function render(topic, mode){
  const d = makeSections(topic, mode);
  const el = document.getElementById("result");
  const updated = new Date().toISOString().split("T")[0];
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <h2 style="margin:0">${d.h2}</h2>
        <div class="muted" style="font-size:12px">By PsySymbol Team · Updated ${updated}</div>
      </div>
      <p class="muted">${d.excerpt}</p>

      <ins class="adsbygoogle ads-slot"
        data-ad-client="ca-pub-3857946786580406" data-ad-slot="1234567890"
        data-ad-format="auto" data-full-width-responsive="true"></ins>

      <h3>Core Themes</h3>
      <ul>${d.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>
      <h3>When It Appears</h3>
      <ul>${d.scenarios.map(s=>`<li>${s}</li>`).join("")}</ul>
      <h3>Journal Prompts</h3>
      <ul>${d.prompts.map(p=>`<li>${p}</li>`).join("")}</ul>
      <h3>Cautions</h3>
      <ul>${d.cautions.map(c=>`<li>${c}</li>`).join("")}</ul>

      <ins class="adsbygoogle ads-slot"
        data-ad-client="ca-pub-3857946786580406" data-ad-slot="9876543210"
        data-ad-format="auto" data-full-width-responsive="true"></ins>

      <h3>Related</h3>
      <div class="badges">${d.related.map(r=>`<span class="badge">${r}</span>`).join("")}</div>
      <div class="disclaimer">Generated programmatically for reflection; not medical or legal advice.</div>
    </div>
  `;
  safePushAds();
}

// -------------------- Tabs & suggestions --------------------
let activeTab = "symbols";
function setTab(tab){
  activeTab = tab;
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===tab));
  renderSuggestions();
  setURL(document.getElementById("query").value || "", activeTab);
}
function renderSuggestions(){
  const box = document.getElementById("suggestions");
  const items = SAMPLES[activeTab] || [];
  box.innerHTML = items.map(s=>`<button class="badge" data-x="${s}" type="button">${s}</button>`).join("");
  box.querySelectorAll(".badge").forEach(b=>b.addEventListener("click",()=> interpret(b.dataset.x)));
}

// -------------------- SEO helpers --------------------
function writeJsonLd(topic){
  const json = {
    "@context":"https://schema.org",
    "@type":"WebSite",
    "name":"PsySymbol",
    "url":"https://psysymbol.com/",
    "publisher":{
      "@type":"Organization",
      "name":"RM Technologies LLC",
      "url":"https://psysymbol.com/"
    },
    "potentialAction":{
      "@type":"SearchAction",
      "target":"https://psysymbol.com/?q={search_term_string}",
      "query-input":"required name=search_term_string"
    }
  };
  if(topic){
    json.mainEntity = {
      "@type":"CreativeWork",
      "name": topic,
      "about": topic,
      "inLanguage":"en"
    };
  }
  const el = document.getElementById('psysymbol-ld');
  if(el) el.textContent = JSON.stringify(json);
}

function setURL(q, tab){
  const u = new URL(location);
  if(q) u.searchParams.set('q', q); else u.searchParams.delete('q');
  if(tab) u.searchParams.set('tab', tab);
  history.replaceState(null,'',u);
}
function hydrateFromURL(){
  const u = new URL(location);
  const q = u.searchParams.get('q'); const tab = u.searchParams.get('tab');
  if(tab) setTab(tab);
  if(q){ document.getElementById('query').value = q; render(q, activeTab); writeJsonLd(q); }
}

// -------------------- Download helpers --------------------
function downloadFile(name, content, type='text/plain'){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function buildSitemap(){
  const base = 'https://psysymbol.com';
  const paths = [
    '/', '/about.html','/privacy.html','/terms.html','/contact.html','/editorial.html',
    '/symbols/black-cat','/symbols/butterfly','/numbers/111','/dreams/losing-teeth'
  ];
  const urls = paths.map(p=>`
    <url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`;
}

function buildRobots(){
  return [
    'User-agent: *',
    'Allow: /',
    'Sitemap: https://psysymbol.com/sitemap.xml'
  ].join('\n');
}

// -------------------- Consent Mode + AdSense loader --------------------
const CONSENT_KEY = 'psysymbol-consent';

function showConsentBanner(show){
  const el = document.getElementById('consent-banner');
  if(!el) return;
  el.hidden = !show;
}

function applyConsent(granted){
  // Update Consent Mode v2
  if(window.gtag){
    gtag('consent','update',{
      ad_storage: granted?'granted':'denied',
      ad_user_data: granted?'granted':'denied',
      ad_personalization: granted?'granted':'denied',
      analytics_storage: granted?'granted':'denied'
    });
  }
  // Persist choice
  localStorage.setItem(CONSENT_KEY, granted?'yes':'no');

  // Load AdSense only if granted and not loaded
  if(granted && !document.querySelector('script[src*="googlesyndication.com/pagead/js/adsbygoogle.js"]')){
    const s=document.createElement('script');
    s.async=true;
    s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3857946786580406";
    s.crossOrigin="anonymous";
    document.head.appendChild(s);
  }
  showConsentBanner(false);
  // Re-fill ads after a tick
  setTimeout(safePushAds, 250);
}

function initConsentUI(){
  const stored = localStorage.getItem(CONSENT_KEY);
  if(stored === 'yes'){ applyConsent(true); return; }
  if(stored === 'no'){ applyConsent(false); return; }
  showConsentBanner(true);
  document.getElementById('consent-accept')?.addEventListener('click', ()=>applyConsent(true));
  document.getElementById('consent-deny')?.addEventListener('click', ()=>applyConsent(false));
}

// -------------------- Interpret (debounced) --------------------
let interpretTimer;
function interpret(term){
  clearTimeout(interpretTimer);
  interpretTimer = setTimeout(()=> {
    const q = (term || document.getElementById("query").value || "").trim();
    if(!q) return;
    render(q, activeTab);
    writeJsonLd(q);
    setURL(q, activeTab);
  }, 120);
}

// -------------------- Events --------------------
document.getElementById("goBtn").addEventListener("click", ()=> interpret());
document.getElementById("query").addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); interpret(); }});
document.getElementById("year").textContent = new Date().getFullYear();
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click", ()=> setTab(t.dataset.tab)));
document.getElementById('dlSiteMap').addEventListener('click', ()=> downloadFile('sitemap.xml', buildSitemap(), 'application/xml'));
document.getElementById('dlRobots').addEventListener('click', ()=> downloadFile('robots.txt', buildRobots(), 'text/plain'));

// Init
setTab("symbols");
renderSuggestions();
hydrateFromURL();
if(!document.getElementById("result").innerHTML) render("black cat","symbols");
writeJsonLd();
initConsentUI();
