/* PsySymbol — Phase 4 (Content Depth & Authority) — PATCHED expandMeaning */
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
  const resultEl = $("#result");
  const relatedEl = $("#related");
  const titleOut = $("#titleOut");
  const badgesEl = $("#sourceBadges");
  const sourcesList = $("#sourcesList");
  const sourcesBlock = $("#sourcesBlock");
  const historyEl = $("#history");
  const cloudEl = $("#cloud");
  const favBtn = $("#favBtn");
  const favStar = $("#favStar");
  const saveJournalBtn = $("#saveJournalBtn");
  const depthBtn = $("#depthBtn");
  const enrichBtn = $("#enrichBtn");
  const depthState = $("#depthState");
  const enrichState = $("#enrichState");
  const copyPermalink = $("#copyPermalink");
  const expandBtn = $("#expandMeaning");
  const followBtn = $("#followSymbol");
  const logo = $("#logo");

  const views = {
    home: $("#view-home"), today: $("#view-today"), trending: $("#view-trending"),
    journal: $("#view-journal"), compare: $("#view-compare")
  };

  let state = {
    mode: storage.get("psysymbol_mode", "dream"),
    depth: storage.get("psysymbol_depth", false),
    enrich: storage.get("psysymbol_enrich", false),
    cache: storage.get("psysymbol_cache", {}),
    lastOutput: null, lastQuery: ""
  };

  const SOURCE_SNIPPETS = {
    Jungian: "Jungian perspective: regards the symbol as an expression of the psyche seeking balance (individuation).",
    Mythic: "Mythic thread: echoes appearing in myths/folklore; consider archetypal narratives and heroic cycles.",
    Cultural: "Cultural lens: meanings shaped by era, region, and tradition; note modern reinterpretations.",
    Numerical: "Numerical angle: reduction, repetition, and pattern significance across numerological systems."
  };

  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function titleFor(mode, q){ return `${mode.toUpperCase()}: ${q}`; }

  function setMode(m){
    state.mode = m; storage.set("psysymbol_mode", m);
    body.classList.remove("mode-dream","mode-symbol","mode-number");
    body.classList.add(`mode-${m}`);
    $$(".tab", modeTabs).forEach(tab => {
      tab.classList.toggle("active", tab.dataset.mode === m);
      tab.setAttribute("aria-selected", tab.dataset.mode === m ? "true" : "false");
    });
    userInput && (userInput.placeholder = m === "dream" ? "Describe a dream… (e.g., 'falling into water')" :
                         m === "symbol" ? "Name a symbol… (e.g., 'lion', 'mirror')" :
                                          "Type a number… (e.g., '333', '11:11')");
  }

  const contextEngine = {
    analyze(text, mode){
      const t = (text||"").toLowerCase();
      const facets = [];
      if (t.includes("water")) facets.push("emotion, flow, subconscious");
      if (t.includes("fall")) facets.push("loss of control, surrender");
      if (/\\b\\d{2,}\\b/.test(t) || mode==="number") facets.push("numerology, pattern");
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
        if (depth){
          bullets.push("Shadow: what are you avoiding or denying?");
          bullets.push("Action: note one feeling on waking + one tiny change to try today.");
        }
      }else if (mode === "symbol"){
        bullets.push(`Core meaning: ${facets[0] ?? "archetypal energy"}`);
        bullets.push("Light: growth, guidance, alignment.");
        bullets.push("Dark: excess, fixation, imbalance.");
        if (depth) bullets.push("Practice: log the symbol for 3 days — where/when it appears.");
      }else{
        const hasRepeats = /(\\d)\\1{1,}/.test(base);
        bullets.push(`Numerology: ${hasRepeats ? "repeating/master pattern" : "sum & reduction"}`);
        if (depth) bullets.push("Prompt: 5-minute journal — earliest memory of this number.");
      }
      return "• " + bullets.join("\\n• ");
    }
  };

  function expandMeaning(mode, q){
    const parts = [];
    if (mode==="symbol"){
      parts.push("Jungian depth: consider how this symbol compensates for an attitude in the conscious mind.");
      parts.push("Cross-culture: compare at least two regions or time periods for shifts in meaning.");
      parts.push("Modern lens: note social-media memes or brand usage that remix the archetype.");
    } else if (mode==="dream"){
      parts.push("Projection check: which qualities in the dream figures belong to you vs. others?");
      parts.push("Somatic angle: where do you feel this in the body on waking?");
    } else {
      parts.push("Number ladder: reduce to a digit and compare with the unreduced pattern.");
      parts.push("Pattern diary: log where the number appears for 3 days and what you're doing then.");
    }
    return "▼ Expanded threads\\n" + parts.map(p => "• " + p).join("\\n");
  }

  async function enrichFromWeb(query, mode){
    const out = [];
    try{
      const w = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim())}`).then(r => r.ok ? r.json() : null);
      if (w && w.extract) out.push(`Wikipedia: ${w.extract}`);
    }catch{}
    if (mode === "number"){
      try{
        const n = query.replace(/\\D/g,"") || "0";
        const text = await fetch(`http://numbersapi.com/${n}/trivia`).then(r => r.ok ? r.text() : "");
        if (text) out.push(`Numbers: ${text}`);
      }catch{}
    }
    return out.join("\\n\\n");
  }

  function suggestRelated(query, mode){
    const seed = (query||"").toLowerCase();
    if (mode === "dream") return ["falling","flying","teeth","water","being chased"].filter(x => !seed.includes(x));
    if (mode === "symbol") return ["lion","mirror","key","snake","tree"].filter(x => !seed.includes(x));
    return ["111","222","333","444","777"].filter(x => !seed.includes(x));
  }

  function updateSEO(mode, q, output){
    const canonical = location.origin + location.pathname + `#/interpret?m=${encodeURIComponent(mode)}&q=${encodeURIComponent(q)}`;
    $("#canonicalLink").setAttribute("href", canonical);
    $("#ogUrl").setAttribute("content", canonical);
    $("#ogTitle").setAttribute("content", `PsySymbol — ${mode.toUpperCase()}: ${q}`);
    $("#ogDesc").setAttribute("content", (output||"").slice(0,180));
    const jsonld = {
      "@context":"https://schema.org",
      "@type": mode==="number" ? "Thing" : "CreativeWork",
      "name": `${mode.toUpperCase()}: ${q}`,
      "description": (output||"").slice(0,240),
      "inLanguage": "en",
      "dateModified": new Date().toISOString()
    };
    $("#jsonld").textContent = JSON.stringify(jsonld, null, 2);
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
  }

  function displayResult(text, related, enrichment){
    resultEl.classList.remove("muted");
    resultEl.textContent = text + (enrichment ? ("\\n\\n" + enrichment) : "");
    relatedEl.innerHTML = "";
    for (const r of related){
      const el = document.createElement("button");
      el.className = "tag";
      el.textContent = r;
      el.addEventListener("click", () => { userInput.value = r; interpret(); });
      relatedEl.appendChild(el);
    }
  }

  function renderHistory(){
    const items = storage.get("psysymbol_history", []);
    historyEl.innerHTML = "";
    if (!items.length){ historyEl.innerHTML = `<div class="muted">No history yet.</div>`; return; }
    for (const it of items){
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `<b>${it.mode.toUpperCase()}:</b> ${escapeHtml(it.query)}<small>${new Date(it.ts).toLocaleString()}</small>`;
      div.addEventListener("click", () => {
        setMode(it.mode); userInput.value = it.query;
        titleOut.textContent = titleFor(it.mode, it.query);
        displayBadges(["Jungian","Cultural"]);
        displayResult(it.output, it.related||[], false);
        updateSEO(it.mode, it.query, it.output);
      });
      historyEl.appendChild(div);
    }
  }

  function renderCloud(){
    const cloud = storage.get("psysymbol_cloud", {});
    const entries = Object.entries(cloud).sort((a,b)=>b[1]-a[1]).slice(0,30);
    cloudEl.innerHTML = "";
    for (const [term, freq] of entries){
      const span = document.createElement("span");
      span.className = "tag"; span.textContent = `${term} (${freq})`;
      span.addEventListener("click", () => { userInput.value = term; interpret(); });
      cloudEl.appendChild(span);
    }
  }

  const journalText = $("#journalText");
  const journalSave = $("#journalSave");
  const journalClear = $("#journalClear");
  const journalList = $("#journalList");
  function renderJournal(){
    if (!journalList) return;
    const entries = storage.get("psysymbol_journal", []);
    journalList.innerHTML = "";
    if (!entries.length){ journalList.innerHTML = `<div class="muted">No entries yet.</div>`; return; }
    entries.forEach((e, idx) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `<b>${new Date(e.ts).toLocaleString()}</b><small>${escapeHtml(e.text).slice(0,180)}</small>`;
      const del = document.createElement("button");
      del.className = "pill"; del.textContent = "Delete";
      del.onclick = () => { const arr = storage.get("psysymbol_journal", []); arr.splice(idx,1); storage.set("psysymbol_journal", arr); renderJournal(); };
      div.appendChild(del); journalList.appendChild(div);
    });
  }
  journalSave && (journalSave.onclick = () => { const text = (journalText.value||"").trim(); if (!text) return; storage.push("psysymbol_journal", { ts: nowISO(), text }); journalText.value = ""; renderJournal(); });
  journalClear && (journalClear.onclick = () => { journalText.value=""; });

  function favKey(mode, query){ return `${mode}:${(query||"").toLowerCase()}` }
  function isFavorited(key){ const fav = storage.get("psysymbol_favorites", {}); return !!fav[key]; }
  function setFavorite(key, data, on){ const fav = storage.get("psysymbol_favorites", {}); if (on) fav[key] = data; else delete fav[key]; storage.set("psysymbol_favorites", fav); }
  function updateFavUI(){ const key = favKey(state.mode, state.lastQuery||""); favStar.textContent = isFavorited(key) ? "★" : "☆"; }
  favBtn && (favBtn.onclick = () => { if (!state.lastQuery) return; const key = favKey(state.mode, state.lastQuery); const data = { ts: nowISO(), mode: state.mode, query: state.lastQuery, output: state.lastOutput }; const on = !isFavorited(key); setFavorite(key, data, on); updateFavUI(); });
  saveJournalBtn && (saveJournalBtn.onclick = () => { if (!state.lastQuery || !state.lastOutput) return; const text = `[${state.mode.toUpperCase()}] ${state.lastQuery}\\n\\n${state.lastOutput}`; storage.push("psysymbol_journal", { ts: nowISO(), text }); renderJournal(); });

  function wireShareLinks(){
    const q = state.lastQuery || "";
    const title = titleFor(state.mode, q);
    const summary = (state.lastOutput||"").split("\\n").slice(0,3).join(" ");
    const url = location.origin + location.pathname + `#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(q)}`;
    $("#shareX").href = `https://x.com/intent/tweet?text=${encodeURIComponent(title + " — " + summary)}&url=${encodeURIComponent(url)}`;
    $("#shareReddit").href = `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    $("#sharePinterest").href = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title + " — " + summary)}`;
    $("#shareWhatsApp").href = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " — " + url)}`;
    $("#shareNative").onclick = async () => { if (navigator.share){ try{ await navigator.share({ title, text: summary, url }); }catch{} } else { alert("Native share not supported. Use the share links."); } };
  }

  copyPermalink && (copyPermalink.onclick = async () => {
    const url = location.origin + location.pathname + `#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(state.lastQuery||"")}`;
    try{ await navigator.clipboard.writeText(url); copyPermalink.textContent = "Copied!"; setTimeout(()=>copyPermalink.textContent="Copy Permalink",1200); }catch{ alert(url); }
  });

  followBtn && (followBtn.onclick = async () => {
    if (!state.lastQuery) return;
    if (!("Notification" in window)) return alert("Notifications not supported in this browser.");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    storage.push("psysymbol_following", { ts: nowISO(), term: state.lastQuery.toLowerCase(), mode: state.mode });
    new Notification("Following symbol", { body: `You'll get gentle reminders about "${state.lastQuery}".` });
  });

  // PATCH: Expand Meaning wiring
  let expandedOn = false;
  expandBtn && (expandBtn.onclick = () => {
    if (!state.lastQuery) return;
    const existing = document.getElementById("expandBlock");
    if (existing){
      existing.remove();
      expandedOn = false;
      expandBtn.textContent = "Expand meaning";
      return;
    }
    const pre = document.createElement("pre");
    pre.id = "expandBlock";
    pre.className = "result";
    pre.textContent = expandMeaning(state.mode, state.lastQuery);
    resultEl.parentElement.appendChild(pre);
    pre.scrollIntoView({ behavior: "smooth", block: "nearest" });
    expandedOn = true;
    expandBtn.textContent = "Collapse";
  });

  async function interpret(){
    const q = (userInput.value||"").trim(); if (!q) return;
    const cacheKey = `${state.mode}:${state.depth?'d':'s'}:${q.toLowerCase()}`;
    let output = state.cache[cacheKey];
    if (!output){ output = coreInterpreter.interpret(q, state.mode, state.depth); state.cache[cacheKey] = output; storage.set("psysymbol_cache", state.cache); }
    if (state.enrich){ try{ const enrichment = await enrichFromWeb(q, state.mode); if (enrichment) output += "\\n\\n" + enrichment; }catch{} }

    state.lastOutput = output; state.lastQuery = q;
    titleOut.textContent = titleFor(state.mode, q);

    displayBadges(["Jungian","Cultural"]);
    const related = suggestRelated(q, state.mode);
    displayResult(output, related, false);

    const existing = document.getElementById("expandBlock");
    if (existing) existing.remove();
    expandedOn = false;
    expandBtn && (expandBtn.textContent = "Expand meaning");

    storage.push("psysymbol_history", { ts: nowISO(), mode: state.mode, query: q, output });
    bumpCloud(q);
    renderHistory(); renderCloud();
    updateFavUI(); wireShareLinks(); updateSEO(state.mode, q, output);
    location.hash = `#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(q)}`;
  }

  function bumpCloud(q){ const cloud = storage.get("psysymbol_cloud", {}); const key = (q||"").toLowerCase(); cloud[key] = (cloud[key]||0) + 1; storage.set("psysymbol_cloud", cloud); }
  function weeklyTrending(){ const items = storage.get("psysymbol_history", []); const cutoff = Date.now() - 7*24*60*60*1000; const counts = {}; for (const it of items){ if (new Date(it.ts).getTime() >= cutoff){ const k = it.query.toLowerCase(); counts[k] = (counts[k]||0) + 1; } } return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20); }
  function renderTrending(){ const list = $("#trendingList"); if (!list) return; const top = weeklyTrending(); list.innerHTML = ""; if (!top.length){ list.innerHTML = "<li class='muted'>No local searches this week yet.</li>"; return; } top.forEach(([term, n]) => { const li = document.createElement("li"); const a = document.createElement("a"); a.href = "#/"; a.textContent = `${term} (${n})`; a.onclick = (e) => { e.preventDefault(); routeTo("#/"); userInput.value = term; interpret(); }; li.appendChild(a); list.appendChild(li); }); }

  function pseudoRandomPick(dateStr, arr){ let h = 0; for (let i=0;i<dateStr.length;i++) h = (h*31 + dateStr.charCodeAt(i)) >>> 0; return arr[h % arr.length]; }
  function renderToday(){ const out = $("#todayOut"); if (!out) return; const dateStr = new Date().toISOString().slice(0,10); const symbols = ["lion","key","mirror","tree","snake","owl","boat","door","moon","sun"]; const numbers = ["111","222","333","444","555","777","888","999","1010","1111"]; const pickType = (new Date().getDate() % 2 === 0) ? "symbol" : "number"; const pick = pickType === "symbol" ? pseudoRandomPick(dateStr, symbols) : pseudoRandomPick(dateStr, numbers); const meaning = coreInterpreter.interpret(pick, pickType, true); out.innerHTML = `<b>${pickType.toUpperCase()} of the Day — ${pick}</b>\\n\\n${meaning}`; }

  function routeTo(hash){
    Object.values(views).forEach(v => v.classList.remove("active"));
    if (hash.startsWith("#/today")) { views.today.classList.add("active"); renderToday(); }
    else if (hash.startsWith("#/trending")) { views.trending.classList.add("active"); renderTrending(); }
    else if (hash.startsWith("#/journal")) { views.journal.classList.add("active"); renderJournal(); }
    else if (hash.startsWith("#/compare")) { views.compare.classList.add("active"); }
    else { views.home.classList.add("active"); }
    if (hash.startsWith("#/interpret")){ const params = new URLSearchParams(hash.split("?")[1]||""); const m = params.get("m"); const q = params.get("q")||""; if (m) setMode(m); if (q){ userInput.value = q; interpret(); } }
  }
  window.addEventListener("hashchange", () => routeTo(location.hash||"#/"));
  routeTo(location.hash||"#/");

  modeTabs.addEventListener("click", (e) => { const tab = e.target.closest(".tab"); if (!tab) return; setMode(tab.dataset.mode); });
  interpretBtn.addEventListener("click", interpret);
  clearBtn.addEventListener("click", () => { userInput.value = ""; userInput.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && document.activeElement === userInput) interpret(); if (e.key === "Escape"){ userInput.value = ""; } });
  $("#clearHistory").addEventListener("click", () => { localStorage.removeItem("psysymbol_history"); renderHistory(); });
  $("#enrichBtn").addEventListener("click", () => { state.enrich = !state.enrich; storage.set("psysymbol_enrich", state.enrich); $("#enrichState").textContent = state.enrich ? "On" : "Off"; });
  $("#depthBtn").addEventListener("click", () => { state.depth = !state.depth; storage.set("psysymbol_depth", state.depth); $("#depthState").textContent = state.depth ? "On" : "Off"; });
  $("#logo").addEventListener("click", () => { userInput.value = ""; setMode("dream"); resultEl.textContent = "Enter something above and tap Interpret."; resultEl.classList.add("muted"); relatedEl.innerHTML = ""; location.hash = "#/"; });

  setMode(state.mode);
  $("#depthState").textContent = state.depth ? "On" : "Off";
  $("#enrichState").textContent = state.enrich ? "On" : "Off";
  renderHistory(); renderCloud();
})();