/* Phase 4 Authority (combined corpus) — script */
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const nowISO = () => new Date().toISOString();

  const storage = {
    get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)) },
    push(key, item){ const arr = storage.get(key, []); arr.unshift(item); storage.set(key, arr.slice(0,400)); }
  };

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
  const copyPermalink = $("#copyPermalink");
  const expandBtn = $("#expandMeaning");
  const followBtn = $("#followSymbol");
  const btnSitemap = $("#btnSitemap");

  const cmpLeft = $("#cmpLeft"), cmpRight = $("#cmpRight");
  const cmpGo = $("#cmpGo"), cmpLeftTitle = $("#cmpLeftTitle"), cmpRightTitle = $("#cmpRightTitle");
  const cmpLeftOut = $("#cmpLeftOut"), cmpRightOut = $("#cmpRightOut");

  let state = { mode: storage.get("psysymbol_mode","dream"), depth:false, enrich:false, cache:{}, lastOutput:null, lastQuery:"", corpus:null };

  function setMode(m){
    state.mode = m; storage.set("psysymbol_mode", m);
    body.classList.remove("mode-dream","mode-symbol","mode-number");
    body.classList.add(`mode-${m}`);
    $$(".tab", modeTabs).forEach(tab => {
      tab.classList.toggle("active", tab.dataset.mode === m);
      tab.setAttribute("aria-selected", tab.dataset.mode === m ? "true" : "false");
    });
  }

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
      const base = (text||"").trim();
      if (!base) return "Please type something to interpret.";
      const { facets } = contextEngine.analyze(base, mode);
      const bullets = [];
      if (mode === "dream"){
        bullets.push(`Theme: ${facets[0] ?? "personal narrative & emotion"}`);
        bullets.push(`Processing: ${facets.slice(1,3).join(" · ") || "recent change or latent wish"}`);
        if (depth){ bullets.push("Shadow: what are you avoiding or denying?"); bullets.push("Action: note one feeling on waking + one tiny change to try today."); }
      }else if (mode === "symbol"){
        bullets.push(`Core meaning: ${facets[0] ?? "archetypal energy"}`);
        bullets.push("Light: growth, guidance, alignment.");
        bullets.push("Dark: excess, fixation, imbalance.");
        if (depth) bullets.push("Practice: log the symbol for 3 days — where/when it appears.");
      }else{
        const hasRepeats = /(\d)\1{1,}/.test(base);
        bullets.push(`Numerology: ${hasRepeats ? "repeating/master pattern" : "sum & reduction"}`);
        if (depth) bullets.push("Prompt: 5-minute journal — earliest memory of this number.");
      }
      return "• " + bullets.join("\n• ");
    }
  };

  const SOURCE_SNIPPETS = {
    Jungian: "Jungian perspective: the symbol speaks for a balancing movement in the psyche.",
    Mythic: "Mythic thread: echoes in folklore and ritual across cultures.",
    Cultural: "Cultural lens: meanings shaped by time, place, and language.",
    Numerical: "Numerical angle: repetition, reduction, and pattern significance."
  };
  function tagSources(mode){
    if (mode === "symbol") return ["Jungian","Mythic","Cultural"];
    if (mode === "dream") return ["Jungian","Cultural"];
    return ["Numerical","Cultural"];
  }
  function displayBadges(tags){
    badgesEl.innerHTML = "";
    for (const t of tags){
      const b = document.createElement("span");
      b.className = "badge";
      b.dataset.type = t;
      b.textContent = t;
      badgesEl.appendChild(b);
    }
    $("#sourcesList").innerHTML = tags.map(t => `— <b>${t}</b>: ${SOURCE_SNIPPETS[t]||""}`).join("<br>");
  }

  function getCorpusKind(){ return state.mode === "dream" ? "archetypes" : (state.mode === "symbol" ? "symbols" : "numbers"); }
  function lookup(q){
    if (!state.corpus) return null;
    const list = state.corpus[getCorpusKind()] || [];
    const k = (q||"").toLowerCase().trim();
    return list.find(e => (e.term||"").toLowerCase() === k) || null;
  }
  function renderSeeAlso(terms){
    seeAlsoEl.innerHTML = "";
    if (!terms || !terms.length) return;
    const label = document.createElement("span");
    label.className = "muted"; label.textContent = "See also:";
    seeAlsoEl.appendChild(label);
    for (const t of terms){
      const btn = document.createElement("button"); btn.className = "tag"; btn.textContent = t;
      btn.onclick = () => { userInput.value = t; interpret(); };
      seeAlsoEl.appendChild(btn);
    }
  }
  function updateSEO(mode, q, desc){
    const canonical = location.origin + location.pathname + `#/interpret?m=${encodeURIComponent(mode)}&q=${encodeURIComponent(q)}`;
    $("#canonicalLink").setAttribute("href", canonical);
    $("#ogUrl").setAttribute("content", canonical);
    $("#ogTitle").setAttribute("content", `PsySymbol — ${mode.toUpperCase()}: ${q}`);
    const d = (desc||"").slice(0,160) || "Archetypal meanings with Jungian psychology & numerology.";
    $("#ogDesc").setAttribute("content", d);
    $("#metaDesc").setAttribute("content", d);
    const jsonld = {"@context":"https://schema.org","@type": mode==="number"?"Thing":"CreativeWork","name":`${mode.toUpperCase()}: ${q}`,"description": d,"inLanguage":"en","dateModified": new Date().toISOString()};
    $("#jsonld").textContent = JSON.stringify(jsonld, null, 2);
  }
  const EXPAND_BLOCK_ID = "expandBlock";
  function removeExpand(){ const el = document.getElementById(EXPAND_BLOCK_ID); if (el) el.remove(); if (expandBtn) expandBtn.textContent = "Expand meaning"; }
  function expansionThreads(mode, q){
    const parts = [];
    if (mode==="symbol"){ parts.push("Jungian depth: how does this image compensate your conscious stance?"); parts.push("Cross-culture: compare two traditions; where does the meaning shift?"); parts.push("Practice: track 3 appearances; note feeling-tone each time."); }
    else if (mode==="dream"){ parts.push("Projection check: which dream figures carry your disowned qualities?"); parts.push("Somatic: name the first body sensation on waking."); parts.push("Ritual: one tiny action that honors what the dream asks."); }
    else { parts.push("Number ladder: reduce to a digit; compare with the unreduced pattern."); parts.push("Notebook: log where it appears for 3 days; note the theme present."); }
    return "▼ Expanded threads\n" + parts.map(p => "• " + p).join("\n");
  }
  expandBtn && (expandBtn.onclick = () => {
    if (!state.lastQuery) return;
    const existing = document.getElementById(EXPAND_BLOCK_ID);
    if (existing){ removeExpand(); return; }
    const pre = document.createElement("pre"); pre.id = EXPAND_BLOCK_ID; pre.className = "result"; pre.textContent = expansionThreads(state.mode, state.lastQuery);
    resultEl.parentElement.appendChild(pre); expandBtn.textContent = "Collapse";
  });

  async function enrichFromWeb(query, mode){
    const out = [];
    try{ const w = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim())}`).then(r => r.ok ? r.json() : null); if (w && w.extract) out.push(`Wikipedia: ${w.extract}`);}catch{}
    if (mode === "number"){
      try{ const n = query.replace(/\D/g,"") || "0"; const text = await fetch(`http://numbersapi.com/${n}/trivia`).then(r => r.ok ? r.text() : ""); if (text) out.push(`Numbers: ${text}`);}catch{}
    }
    return out.join("\n\n");
  }

  async function interpret(){
    const q = (userInput.value||"").trim(); if (!q) return;
    if (/^\d+([:.-]\d+)?$/.test(q) && state.mode!=="number"){ setMode("number"); }
    const output = coreInterpreter.interpret(q, state.mode, state.depth);
    const entry = lookup(q);
    metaLine.textContent = entry?.meta || "";
    renderSeeAlso(entry?.see || []);
    titleOut.textContent = `${state.mode.toUpperCase()}: ${q}`;
    resultEl.classList.remove("muted"); resultEl.textContent = output;
    relatedEl.innerHTML = "";
    ["lion","mirror","key","snake","tree"].forEach(r => { const el=document.createElement("button"); el.className="tag"; el.textContent=r; el.onclick=()=>{userInput.value=r; interpret();}; relatedEl.appendChild(el); });
    badgesEl.innerHTML = ""; tagSources(state.mode).forEach(t => { const b=document.createElement("span"); b.className="badge"; b.dataset.type=t; b.textContent=t; badgesEl.appendChild(b); });
    sourcesList.innerHTML = tagSources(state.mode).map(t => `— <b>${t}</b>: ${SOURCE_SNIPPETS[t]||""}`).join("<br>");
    removeExpand();
    state.lastQuery = q; state.lastOutput = output;
    storage.push("psysymbol_history",{ts:nowISO(),mode:state.mode,query:q,output});
    updateSEO(state.mode, q, entry?.meta || output);
    location.hash = `#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(q)}`;
  }

  function doCompare(L, R){
    if (!L || !R) return;
    cmpLeftTitle.textContent = "SYMBOL: " + L; cmpRightTitle.textContent = "SYMBOL: " + R;
    cmpLeftOut.textContent = coreInterpreter.interpret(L, "symbol", true);
    cmpRightOut.textContent = coreInterpreter.interpret(R, "symbol", true);
    location.hash = `#/compare?l=${encodeURIComponent(L)}&r=${encodeURIComponent(R)}`;
  }
  if (cmpGo){
    cmpGo.onclick = () => doCompare((cmpLeft.value||"").trim(), (cmpRight.value||"").trim());
    [cmpLeft, cmpRight].forEach(inp => inp && inp.addEventListener("keydown", (e) => { if (e.key === "Enter") doCompare((cmpLeft.value||"").trim(), (cmpRight.value||"").trim()); }));
  }

  function weeklyTrending(){ const items = storage.get("psysymbol_history", []); const cutoff = Date.now() - 7*24*60*60*1000; const counts = {}; for (const it of items){ if (new Date(it.ts).getTime() >= cutoff){ const k = it.query.toLowerCase(); counts[k] = (counts[k]||0) + 1; } } return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20); }
  function renderTrending(){ const list = $("#trendingList"); if (!list) return; const top = weeklyTrending(); list.innerHTML = ""; if (!top.length){ list.innerHTML = "<li class='muted'>No local searches this week yet.</li>"; return; } top.forEach(([term, n]) => { const li = document.createElement("li"); const a = document.createElement("a"); a.href = "#/"; a.textContent = `${term} (${n})`; a.onclick = (e) => { e.preventDefault(); routeTo("#/"); userInput.value = term; interpret(); }; li.appendChild(a); list.appendChild(li); }); }
  function pseudoRandomPick(dateStr, arr){ let h = 0; for (let i=0;i<dateStr.length;i++) h = (h*31 + dateStr.charCodeAt(i)) >>> 0; return arr[h % arr.length]; }
  function renderToday(){ const out = $("#todayOut"); if (!out || !state.corpus) return; const dateStr = new Date().toISOString().slice(0,10); const symbols = state.corpus.symbols.map(e=>e.term); const numbers = state.corpus.numbers.map(e=>e.term); const pickType = (new Date().getDate() % 2 === 0) ? "symbol" : "number"; const pick = pickType === "symbol" ? pseudoRandomPick(dateStr, symbols) : pseudoRandomPick(dateStr, numbers); const meaning = coreInterpreter.interpret(pick, pickType, true); out.innerHTML = `<b>${pickType.toUpperCase()} of the Day — ${pick}</b>\n\n${meaning}`; }

  function routeTo(hash){
    $$("#view-home, #view-today, #view-trending, #view-journal, #view-compare").forEach(v => v.classList.remove("active"));
    if (hash.startsWith("#/today")) { $("#view-today").classList.add("active"); renderToday(); }
    else if (hash.startsWith("#/trending")) { $("#view-trending").classList.add("active"); renderTrending(); }
    else if (hash.startsWith("#/journal")) { $("#view-journal").classList.add("active"); }
    else if (hash.startsWith("#/compare")) {
      $("#view-compare").classList.add("active");
      const params = new URLSearchParams(hash.split("?")[1]||"");
      const L = (params.get("l")||"").trim(); const R = (params.get("r")||"").trim();
      if (L) cmpLeft.value = L; if (R) cmpRight.value = R; if (L && R) doCompare(L,R);
    } else { $("#view-home").classList.add("active"); }
    if (hash.startsWith("#/interpret")){
      const params = new URLSearchParams(hash.split("?")[1]||""); const m = params.get("m"); const q = params.get("q")||""; if (m) setMode(m); if (q){ userInput.value = q; interpret(); }
    }
  }
  window.addEventListener("hashchange", () => routeTo(location.hash||"#/"));

  function buildSitemap(){
    const get = (k)=>{ try{ return JSON.parse(localStorage.getItem(k))||[] }catch{ return [] } };
    const history = get("psysymbol_history");
    const favs = Object.values(JSON.parse(localStorage.getItem("psysymbol_favorites")||"{}"));
    const cloud = JSON.parse(localStorage.getItem("psysymbol_cloud")||"{}");
    const terms = new Set();
    history.forEach(it => terms.add(`${it.mode}:${it.query.toLowerCase()}`));
    favs.forEach(it => terms.add(`${it.mode}:${it.query.toLowerCase()}`));
    Object.keys(cloud).forEach(k => terms.add(`symbol:${k}`));
    const base = location.origin + location.pathname.replace(/\/index\.html?$/,"");
    const urls = Array.from(terms).map(t => { const [m,q] = t.split(":"); const loc = `${base}#/interpret?m=${encodeURIComponent(m)}&q=${encodeURIComponent(q)}`; return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`; }).join("");
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  }
  btnSitemap && (btnSitemap.onclick = () => {
    const blob = new Blob([buildSitemap()], {type: "application/xml"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "sitemap.xml"; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
  });

  async function boot(){
    try{ const res = await fetch("data/corpus.json"); if (res.ok){ state.corpus = await res.json(); } }catch{ state.corpus = null; }
    setMode(state.mode);
    $("#depthState").textContent = state.depth ? "On" : "Off";
    $("#enrichState").textContent = state.enrich ? "On" : "Off";
    routeTo(location.hash||"#/");
  }
  boot();
})();