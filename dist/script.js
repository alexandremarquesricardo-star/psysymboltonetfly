/* Phase 5 — Monetization & Retention */
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const nowISO = () => new Date().toISOString();

  const storage = {
    get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)) },
    push(key, item){ const arr = storage.get(key, []); arr.unshift(item); storage.set(key, arr.slice(0,400)); }
  };

  // Elements
  const body = document.body;
  const modeTabs = $("#modeTabs");
  const userInput = $("#userInput");
  const interpretBtn = $("#interpretBtn");
  const clearBtn = $("#clearBtn");
  const titleOut = $("#titleOut");
  const metaLine = $("#metaLine");
  const resultEl = $("#result");
  const seeAlsoEl = $("#seeAlso");
  const relatedEl = $("#related");
  const badgesEl = $("#sourceBadges");
  const sourcesList = $("#sourcesList");
  const expandBtn = $("#expandMeaning");
  const btnSitemap = $("#btnSitemap");
  const btnDaily = $("#btnDaily");

  // Compare
  const cmpLeft = $("#cmpLeft"), cmpRight = $("#cmpRight");
  const cmpGo = $("#cmpGo"), cmpLeftTitle = $("#cmpLeftTitle"), cmpRightTitle = $("#cmpRightTitle");
  const cmpLeftOut = $("#cmpLeftOut"), cmpRightOut = $("#cmpRightOut");

  // State
  let state = {
    mode: storage.get("psysymbol_mode", "dream"),
    depth: storage.get("psysymbol_depth", false),
    enrich: storage.get("psysymbol_enrich", false),
    lastOutput: null, lastQuery: "",
    corpus: null
  };

  // Corpus
  async function loadCorpus(){ try{ const r = await fetch("data/corpus.json"); if (r.ok){ state.corpus = await r.json(); } }catch{} }

  function setMode(m){
    state.mode = m; storage.set("psysymbol_mode", m);
    body.classList.remove("mode-dream","mode-symbol","mode-number");
    body.classList.add(`mode-${m}`);
    $$(".tab", modeTabs).forEach(tab => { tab.classList.toggle("active", tab.dataset.mode === m); tab.setAttribute("aria-selected", tab.dataset.mode === m ? "true" : "false"); });
    userInput && (userInput.placeholder = m === "dream" ? "Describe a dream… (e.g., 'falling into water')" :
                         m === "symbol" ? "Name a symbol… (e.g., 'lion', 'mirror')" :
                                          "Type a number… (e.g., '333', '11:11')");
  }

  // Engines
  const SOURCE_SNIPPETS = {
    Jungian: "Jungian: the symbol moves to balance the conscious attitude.",
    Mythic: "Mythic: echoes across folklore and ritual.",
    Cultural: "Cultural: meanings shift by era and region.",
    Numerical: "Numerical: repetition, reduction, pattern."
  };
  function tagSources(mode){ if (mode==="symbol") return ["Jungian","Mythic","Cultural"]; if (mode==="dream") return ["Jungian","Cultural"]; return ["Numerical","Cultural"]; }
  const contextEngine = {
    analyze(text, mode){
      const t = (text||"").toLowerCase();
      const facets = [];
      if (t.includes("water")) facets.push("emotion, flow, subconscious");
      if (t.includes("fall")) facets.push("loss of control, surrender");
      if (/\b\d{2,}\b/.test(t) || mode==="number") facets.push("numerology, pattern");
      if (t.includes("chased")) facets.push("anxiety, avoidance");
      if (t.includes("teeth")) facets.push("appearance, vulnerability");
      if (t.includes("mirror")) facets.push("self-image, reflection");
      if (t.includes("lion")) facets.push("courage, leadership, pride");
      return { facets };
    }
  };
  const coreInterpreter = {
    interpret(text, mode, depth){
      const base = (text||"").trim(); if (!base) return "Please type something to interpret.";
      const { facets } = contextEngine.analyze(base, mode);
      const bullets = [];
      if (mode === "dream"){
        bullets.push(`Theme: ${facets[0] ?? "personal narrative & emotion"}`);
        bullets.push(`Processing: ${facets.slice(1,3).join(" · ") || "recent change or latent wish"}`);
        if (depth){ bullets.push("Shadow: what is being avoided?"); bullets.push("Act: one tiny change today."); }
      }else if (mode === "symbol"){
        bullets.push(`Core: ${facets[0] ?? "archetypal energy"}`);
        bullets.push("Light: growth, guidance, alignment.");
        bullets.push("Dark: excess, fixation, imbalance.");
        if (depth) bullets.push("Practice: track 3 appearances this week.");
      }else{
        const hasRepeats = /(\d)\1{1,}/.test(base);
        bullets.push(`Numerology: ${hasRepeats ? "repeating/master pattern" : "sum & reduction"}`);
        if (depth) bullets.push("Prompt: earliest memory of this number.");
      }
      return "• " + bullets.join("\n• ");
    }
  };

  // Corpus helpers
  function getKind(){ return state.mode==="dream"?"archetypes":(state.mode==="symbol"?"symbols":"numbers"); }
  function lookup(q){
    if (!state.corpus) return null;
    const list = state.corpus[getKind()]||[];
    const k = (q||"").toLowerCase().trim();
    return list.find(e => (e.term||"").toLowerCase()===k) || null;
  }
  function renderSeeAlso(terms){
    seeAlsoEl.innerHTML = "";
    if (!terms || !terms.length) return;
    const label = document.createElement("span"); label.className="muted"; label.textContent="See also:"; seeAlsoEl.appendChild(label);
    for (const t of terms){ const btn=document.createElement("button"); btn.className="tag"; btn.textContent=t; btn.onclick=()=>{ userInput.value=t; interpret(); }; seeAlsoEl.appendChild(btn); }
  }

  // SEO
  function updateSEO(mode, q, desc){
    const canonical = location.origin + location.pathname + `#/interpret?m=${encodeURIComponent(mode)}&q=${encodeURIComponent(q)}`;
    $("#canonicalLink").setAttribute("href", canonical);
    $("#ogUrl").setAttribute("content", canonical);
    $("#ogTitle").setAttribute("content", `PsySymbol — ${mode.toUpperCase()}: ${q}`);
    const d = (desc||"").slice(0,160) || "Archetypal meanings with Jungian psychology & numerology.";
    $("#ogDesc").setAttribute("content", d); $("#metaDesc").setAttribute("content", d);
    const jsonld = {"@context":"https://schema.org","@type": mode==="number"?"Thing":"CreativeWork","name":`${mode.toUpperCase()}: ${q}`,"description": d,"inLanguage":"en","dateModified": new Date().toISOString()};
    $("#jsonld").textContent = JSON.stringify(jsonld, null, 2);
  }

  // Expand
  const EXPAND_BLOCK_ID = "expandBlock";
  function removeExpand(){ const el=document.getElementById(EXPAND_BLOCK_ID); if (el) el.remove(); if (expandBtn) expandBtn.textContent="Expand meaning"; }
  function expansionThreads(mode, q){
    const parts=[];
    if (mode==="symbol"){ parts.push("Depth: how does this image compensate your stance?"); parts.push("Cross-culture: compare two traditions."); parts.push("Practice: track 3 appearances."); }
    else if (mode==="dream"){ parts.push("Projection: which figure holds your disowned quality?"); parts.push("Somatic: first body sensation on waking."); parts.push("Ritual: one tiny honoring action."); }
    else { parts.push("Reduce to a digit; compare patterns."); parts.push("Notebook: where does it appear this week?"); }
    return "▼ Expanded threads\n" + parts.map(p=>"• "+p).join("\\n");
  }
  expandBtn && (expandBtn.onclick = () => {
    if (!state.lastQuery) return;
    const ex = document.getElementById(EXPAND_BLOCK_ID);
    if (ex){ removeExpand(); return; }
    const pre=document.createElement("pre"); pre.id=EXPAND_BLOCK_ID; pre.className="result"; pre.textContent=expansionThreads(state.mode, state.lastQuery);
    resultEl.parentElement.appendChild(pre); expandBtn.textContent="Collapse";
  });

  // Phase 5: Ads + Unlock + Notifications
  function injectAdAfterFirstParagraph(container){
    try{
      if (!window.adsbygoogle) return;
      if (container.dataset.adInjected === "1") return;
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client","ca-pub-3857946786580406");
      ins.setAttribute("data-ad-format","auto");
      ins.setAttribute("data-full-width-responsive","true");
      container.appendChild(ins);
      (adsbygoogle = window.adsbygoogle || []).push({});
      container.dataset.adInjected = "1";
    }catch(e){}
  }
  function unlockKey(mode,q){ return `unlocked:${mode}:${(q||'').toLowerCase()}`; }
  function isUnlocked(mode,q){ return !!localStorage.getItem(unlockKey(mode,q)); }
  function markUnlocked(mode,q){ localStorage.setItem(unlockKey(mode,q), JSON.stringify({ts:Date.now()})); }
  function renderUnlockCTA(mode,q){
    const btn=document.createElement("button"); btn.className="pill"; btn.textContent="Unlock Full Interpretation ($2)";
    btn.onclick=()=>{ if(confirm("Unlock full interpretation for $2?")){ markUnlocked(mode,q); alert("Thanks! Unlocked."); interpret(); } };
    return btn;
  }
  async function requestDaily(){
    if (!("Notification" in window)) return alert("Notifications not supported.");
    const perm = await Notification.requestPermission(); if (perm!=="granted") return;
    localStorage.setItem("psysymbol_daily_notif","on"); alert("Daily notifications enabled while the site is open.");
  }
  btnDaily && (btnDaily.onclick = requestDaily);
  function maybeFireDaily(){ try{ if(localStorage.getItem("psysymbol_daily_notif")!=="on") return; const last=+localStorage.getItem("psysymbol_daily_notif_last")||0; const now=Date.now(); const DAY=24*60*60*1000; if(now-last>DAY){ localStorage.setItem("psysymbol_daily_notif_last",String(now)); new Notification("Symbol of the Day",{ body:"Tap to receive today’s sign."}); } }catch(e){} }
  setInterval(maybeFireDaily, 60*1000);

  // Interpret
  async function interpret(){
    const q = (userInput.value||"").trim(); if (!q) return;
    if (/^\d+([:.-]\d+)?$/.test(q) && state.mode!=="number"){ setMode("number"); }
    const entry = lookup(q);
    metaLine.textContent = entry?.meta || "";
    renderSeeAlso(entry?.see || []);
    const out = coreInterpreter.interpret(q, state.mode, state.depth);
    titleOut.textContent = `${state.mode.toUpperCase()}: ${q}`;
    resultEl.classList.remove("muted");
    resultEl.textContent = out;
    injectAdAfterFirstParagraph(resultEl);
    // Unlock/paywall
    const holder=document.createElement("div"); holder.style.marginTop="8px";
    if (!isUnlocked(state.mode,q)){ holder.appendChild(renderUnlockCTA(state.mode,q)); }
    resultEl.parentElement.appendChild(holder);

    badgesEl.innerHTML=""; const tags=tagSources(state.mode); tags.forEach(t=>{ const b=document.createElement("span"); b.className="badge"; b.dataset.type=t; b.textContent=t; badgesEl.appendChild(b); });
    sourcesList.innerHTML = tags.map(t => `— <b>${t}</b>: ${SOURCE_SNIPPETS[t]||""}`).join("<br>");

    state.lastQuery = q; state.lastOutput = out;
    storage.push("psysymbol_history",{ts:nowISO(), mode:state.mode, query:q, output:out});
    updateSEO(state.mode, q, entry?.meta || out);
    location.hash = `#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(q)}`;
  }

  // Compare
  function doCompare(L,R){ if(!L||!R) return; cmpLeftTitle.textContent="SYMBOL: "+L; cmpRightTitle.textContent="SYMBOL: "+R; cmpLeftOut.textContent=coreInterpreter.interpret(L,"symbol",true); cmpRightOut.textContent=coreInterpreter.interpret(R,"symbol",true); location.hash = `#/compare?l=${encodeURIComponent(L)}&r=${encodeURIComponent(R)}`; }
  if (cmpGo){ cmpGo.onclick=()=>doCompare((cmpLeft.value||'').trim(), (cmpRight.value||'').trim()); [cmpLeft,cmpRight].forEach(inp=>inp&&inp.addEventListener("keydown",(e)=>{ if(e.key==="Enter") doCompare((cmpLeft.value||'').trim(), (cmpRight.value||'').trim()); })); }

  // Pages / routing
  function weeklyTrending(){ const items=storage.get("psysymbol_history",[]); const cut=Date.now()-7*24*60*60*1000; const counts={}; for(const it of items){ if(new Date(it.ts).getTime()>=cut){ const k=it.query.toLowerCase(); counts[k]=(counts[k]||0)+1; } } return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20); }
  function renderTrending(){ const list=$("#trendingList"); if(!list) return; const top=weeklyTrending(); list.innerHTML=""; if(!top.length){ list.innerHTML="<li class='muted'>No local searches this week yet.</li>"; return; } top.forEach(([term,n])=>{ const li=document.createElement("li"); const a=document.createElement("a"); a.href="#/"; a.textContent=`${term} (${n})`; a.onclick=(e)=>{e.preventDefault(); routeTo("#/"); userInput.value=term; interpret();}; li.appendChild(a); list.appendChild(li); }); }
  function pseudoRandomPick(dateStr, arr){ let h=0; for (let i=0;i<dateStr.length;i++) h=(h*31 + dateStr.charCodeAt(i))>>>0; return arr[h % arr.length]; }
  function renderToday(){ const out=$("#todayOut"); if(!out || !state.corpus) return; const dateStr=new Date().toISOString().slice(0,10); const symbols=state.corpus.symbols.map(e=>e.term); const numbers=state.corpus.numbers.map(e=>e.term); const type=(new Date().getDate()%2===0)?"symbol":"number"; const pick= type==="symbol"? pseudoRandomPick(dateStr, symbols) : pseudoRandomPick(dateStr, numbers); const meaning=coreInterpreter.interpret(pick, type, true); out.innerHTML = `<b>${type.toUpperCase()} of the Day — ${pick}</b>\\n\\n${meaning}`; }

  function routeTo(hash){
    $$("#view-home, #view-today, #view-trending, #view-journal, #view-compare").forEach(v=>v.classList.remove("active"));
    if (hash.startsWith("#/today")) { $("#view-today").classList.add("active"); renderToday(); }
    else if (hash.startsWith("#/trending")) { $("#view-trending").classList.add("active"); renderTrending(); }
    else if (hash.startsWith("#/journal")) { $("#view-journal").classList.add("active"); }
    else if (hash.startsWith("#/compare")) { $("#view-compare").classList.add("active"); const params = new URLSearchParams(hash.split("?")[1]||""); const L=(params.get("l")||"").trim(), R=(params.get("r")||"").trim(); if(L) cmpLeft.value=L; if(R) cmpRight.value=R; if(L&&R) doCompare(L,R); }
    else { $("#view-home").classList.add("active"); }
    if (hash.startsWith("#/interpret")){ const p=new URLSearchParams(hash.split("?")[1]||""); const m=p.get("m"), q=p.get("q")||""; if(m) setMode(m); if(q){ userInput.value=q; interpret(); } }
  }
  window.addEventListener("hashchange", ()=>routeTo(location.hash||"#/"));

  // Sitemap (includes static pages)
  function buildSitemap(){
    const base = location.origin + location.pathname.replace(/\\/index\\.html?$/,"");
    const urls = [`${base}#/`, `${base}#/today`, `${base}#/trending`, `${base}#/journal`, `${base}#/compare`, `${base}about.html`, `${base}privacy.html`];
    const xml = urls.map(u=>`<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`).join("");
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`;
  }
  btnSitemap && (btnSitemap.onclick = () => { const blob=new Blob([buildSitemap()],{type:"application/xml"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="sitemap.xml"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); });

  // Events
  modeTabs.addEventListener("click", (e) => { const tab=e.target.closest(".tab"); if (!tab) return; setMode(tab.dataset.mode); });
  interpretBtn.addEventListener("click", interpret);
  clearBtn.addEventListener("click", ()=>{ userInput.value=""; userInput.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && document.activeElement === userInput) interpret(); });

  async function boot(){ await loadCorpus(); setMode(state.mode); routeTo(location.hash||"#/"); }
  boot();
})();