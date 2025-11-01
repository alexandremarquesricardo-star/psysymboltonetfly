
(() => {
  const $ = (s, r=document)=>r.querySelector(s);
  const nowISO = () => new Date().toISOString();
  const resultEl = $("#result"); const metaLine = $("#metaLine"); const seeAlsoEl = $("#seeAlso");
  let state = { mode:"symbol", depth:false, corpus:null, lastQuery:"" };

  async function loadCorpus(){ try{ const r = await fetch("data/corpus.json"); if (r.ok){ state.corpus = await r.json(); } }catch{} }
  function lookupSymbol(q){
    if (!state.corpus) return null; const k = (q||"").toLowerCase().trim();
    const lists = ["archetypes","symbols","numbers"];
    for (const L of lists){ const hit = (state.corpus[L]||[]).find(e => (e.term||"").toLowerCase()===k); if (hit) return hit; }
    return null;
  }
  function interpret(q){
    if (!q) return;
    const entry = lookupSymbol(q);
    const base = `• Core meaning: archetypal energy\n• Light: growth, guidance, alignment.\n• Dark: excess, fixation, imbalance.`;
    metaLine.textContent = entry?.meta || "";
    resultEl.textContent = base;
    state.lastQuery = q;
    // inject ad
    try{
      if (window.adsbygoogle && resultEl.dataset.adInjected!=="1"){
        const ins = document.createElement("ins"); ins.className="adsbygoogle"; ins.style.display="block";
        ins.setAttribute("data-ad-client","ca-pub-3857946786580406"); ins.setAttribute("data-ad-format","auto"); ins.setAttribute("data-full-width-responsive","true");
        resultEl.appendChild(ins); (adsbygoogle = window.adsbygoogle || []).push({}); resultEl.dataset.adInjected="1";
      }
    }catch{}
    // unlock
    const holder = document.createElement("div"); holder.style.marginTop="8px";
    const btn = document.createElement("button"); btn.className="pill"; btn.textContent="Unlock Full Interpretation ($2)";
    btn.onclick = ()=>{ alert("Thanks! Unlocked."); holder.remove(); };
    holder.appendChild(btn); resultEl.parentElement.appendChild(holder);
    // see also
    seeAlsoEl.innerHTML=""; const terms = entry?.see || []; if (terms.length){ const label=document.createElement("span"); label.className="muted"; label.textContent="See also:"; seeAlsoEl.appendChild(label); for (const t of terms){ const b=document.createElement("button"); b.className="pill"; b.textContent=t; b.onclick=()=>interpret(t); seeAlsoEl.appendChild(b); } }
  }

  $("#interpretBtn").onclick = () => { const q = $("#userInput").value.trim(); if (q) interpret(q); };
  $("#clearBtn").onclick = () => { $("#userInput").value=""; metaLine.textContent=""; resultEl.textContent="Enter something and tap Interpret."; seeAlsoEl.innerHTML=""; };

  function buildSitemap(){
    const base = location.origin + location.pathname.replace(/\/index\.html?$/,"");
    const urls = [`${base}#/`, `${base}privacy.html`, `${base}about.html`];
    const xml = urls.map(u=>`<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`).join("");
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`;
  }
  $("#btnSitemap").onclick = ()=>{ const blob=new Blob([buildSitemap()],{type:"application/xml"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="sitemap.xml"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); };

  $("#btnDaily").onclick = async ()=>{
    if (!("Notification" in window)) return alert("Notifications not supported.");
    const perm = await Notification.requestPermission(); if (perm!=="granted") return;
    new Notification("Symbol of the Day",{ body:"Tap to receive today’s sign."});
  };

  (async()=>{ await loadCorpus(); })();
})();
