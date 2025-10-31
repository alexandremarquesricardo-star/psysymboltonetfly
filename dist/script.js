/* PsySymbol — Phase 3 core (client-side only) */
(() => {
  // ---------- Utilities ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const nowISO = () => new Date().toISOString();

  const storage = {
    get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)) },
    push(key, item){
      const arr = storage.get(key, []);
      arr.unshift(item);
      storage.set(key, arr.slice(0,200));
    }
  };

  // ---------- State ----------
  let state = {
    mode: storage.get("psysymbol_mode", "dream"),
    depth: storage.get("psysymbol_depth", false),
    enrich: storage.get("psysymbol_enrich", false),
    cache: storage.get("psysymbol_cache", {}),
  };

  // ---------- Elements ----------
  const body = document.body;
  const modeTabs = $("#modeTabs");
  const userInput = $("#userInput");
  const interpretBtn = $("#interpretBtn");
  const clearBtn = $("#clearBtn");
  const depthToggle = $("#depthToggle");
  const enrichToggle = $("#enrichToggle");
  const resultEl = $("#result");
  const relatedEl = $("#related");
  const historyEl = $("#history");
  const clearHistoryBtn = $("#clearHistory");
  const cloudEl = $("#cloud");
  const logo = $("#logo");

  // ---------- Mode handling ----------
  function setMode(m){
    state.mode = m;
    storage.set("psysymbol_mode", m);
    body.classList.remove("mode-dream","mode-symbol","mode-number");
    body.classList.add(`mode-${m}`);
    $$(".tab", modeTabs).forEach(tab => {
      tab.classList.toggle("active", tab.dataset.mode === m);
      tab.setAttribute("aria-selected", tab.dataset.mode === m ? "true" : "false");
    });
    userInput.placeholder = m === "dream" ? "Describe a dream… (e.g., 'falling into water')" :
                         m === "symbol" ? "Name a symbol… (e.g., 'lion', 'mirror')" :
                                          "Type a number… (e.g., '333', '11:11')";
  }

  // ---------- Context Engine ----------
  const contextEngine = {
    analyze(text, mode){
      // Simple heuristics to influence tone and facets
      const t = text.toLowerCase();
      const facets = [];
      if (t.includes("water")) facets.push("emotion, flow, subconscious");
      if (t.includes("fall") || t.includes("falling")) facets.push("loss of control, surrender");
      if (/\b\d{2,}\b/.test(t) || mode==="number") facets.push("numerology, pattern recognition");
      if (t.includes("chased") || t.includes("escape")) facets.push("anxiety, avoidance");
      if (t.includes("teeth")) facets.push("appearance, vulnerability");
      if (t.includes("mirror")) facets.push("self-image, reflection");
      if (t.includes("lion")) facets.push("courage, leadership, pride");
      return { facets, tone: mode };
    }
  };

  // ---------- Core Interpreter ----------
  const coreInterpreter = {
    interpret(text, mode, depth, context){
      const base = text.trim();
      if (!base) return "Please type something to interpret.";

      const { facets } = contextEngine.analyze(base, mode);
      const bullets = [];

      if (mode === "dream"){
        bullets.push(`Theme: ${facets[0] ?? "personal narrative & emotion"}`);
        bullets.push(`You may be processing: ${facets.slice(1,3).join(" · ") || "recent changes or latent wishes"}`);
        if (depth){
          bullets.push("Shadow angle: what are you avoiding or denying?");
          bullets.push("Action: note one feeling on waking and one change you could try today.");
        }
      } else if (mode === "symbol"){
        bullets.push(`Core meaning: ${facets[0] ?? "archetypal energy"}`);
        bullets.push("Light aspect: growth, guidance, alignment.");
        bullets.push("Dark aspect: excess, fixation, imbalance.");
        if (depth){
          bullets.push("Ritual: keep a 3‑day symbol log; note when it appears IRL or in media.");
        }
      } else {
        // number
        const hasRepeats = /(\d)\1{1,}/.test(base);
        bullets.push(`Numerology focus: ${hasRepeats ? "master/repeating pattern" : "sum & reduction"}`);
        bullets.push("Check: life area where this number shows up repeatedly.");
        if (depth){
          bullets.push("Prompt: journal 5 minutes on what this number meant to you as a child.");
        }
      }

      return `• ${bullets.join("\n• ")}`;
    }
  };

  // ---------- Enrichment ----------
  async function enrichFromWeb(query, mode){
    // Wikipedia summary + Numbers API (for numbers)
    const out = [];
    try{
      const wikiTitle = encodeURIComponent(query.trim());
      const wikiURL = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`;
      const w = await fetch(wikiURL).then(r => r.ok ? r.json() : null);
      if (w && w.extract) out.push(`Wikipedia: ${w.extract}`);
    }catch{ /* ignore */ }

    if (mode === "number"){
      try{
        const n = query.replace(/\D/g,"") || "0";
        const numURL = `https://numbersapi.p.mashape.com/${n}/trivia?json`;
        // Fallback free endpoint:
        const freeURL = `http://numbersapi.com/${n}/trivia`;
        let text = "";
        try{
          text = await fetch(numURL, { headers: { "X-Mashape-Key": "" }}).then(r => r.ok ? r.text() : "");
        }catch{
          text = await fetch(freeURL).then(r => r.ok ? r.text() : "");
        }
        if (text) out.push(`Numbers: ${text}`);
      }catch{ /* ignore */ }
    }
    return out.join("\n\n");
  }

  // ---------- Related ----------
  function suggestRelated(query, mode){
    const seed = query.toLowerCase();
    if (mode === "dream"){
      return ["falling","flying","teeth","water","being chased"].filter(x => !seed.includes(x));
    }
    if (mode === "symbol"){
      return ["lion","mirror","key","snake","tree"].filter(x => !seed.includes(x));
    }
    // number
    return ["111","222","333","444","777"].filter(x => !seed.includes(x));
  }

  // ---------- History & Cloud ----------
  function renderHistory(){
    const items = storage.get("psysymbol_history", []);
    historyEl.innerHTML = "";
    if (!items.length){
      historyEl.innerHTML = `<div class="muted">No history yet.</div>`;
      return;
    }
    for (const it of items){
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `<b>${it.mode.toUpperCase()}:</b> ${escapeHtml(it.query)}<small>${new Date(it.ts).toLocaleString()}</small>`;
      div.addEventListener("click", () => {
        setMode(it.mode);
        userInput.value = it.query;
        displayResult(it.output, it.related, it.enrichment);
      });
      historyEl.appendChild(div);
    }
  }

  function updateCloud(query){
    const cloud = storage.get("psysymbol_cloud", {});
    cloud[query.toLowerCase()] = (cloud[query.toLowerCase()] ?? 0) + 1;
    storage.set("psysymbol_cloud", cloud);
    renderCloud();
  }

  function renderCloud(){
    const cloud = storage.get("psysymbol_cloud", {});
    const entries = Object.entries(cloud).sort((a,b)=>b[1]-a[1]).slice(0,40);
    cloudEl.innerHTML = "";
    for (const [term, freq] of entries){
      const span = document.createElement("span");
      const size = 12 + Math.min(18, Math.floor(freq*2));
      span.style.fontSize = size + "px";
      span.className = "tag";
      span.textContent = term;
      span.title = `Seen ${freq}×`;
      span.addEventListener("click", () => {
        userInput.value = term;
        userInput.focus();
      });
      cloudEl.appendChild(span);
    }
  }

  // ---------- Rendering ----------
  function displayResult(text, related, enrichment){
    resultEl.classList.remove("muted");
    resultEl.textContent = text;
    relatedEl.innerHTML = "";
    for (const r of related){
      const el = document.createElement("button");
      el.className = "tag";
      el.textContent = r;
      el.addEventListener("click", () => {
        userInput.value = r;
        interpret();
      });
      relatedEl.appendChild(el);
    }
    if (enrichment){
      const sep = document.createElement("div");
      sep.style.marginTop = "12px";
      const pre = document.createElement("div");
      pre.className = "result muted";
      pre.textContent = enrichment;
      sep.appendChild(pre);
      relatedEl.parentElement.appendChild(sep);
    }
  }

  // ---------- Feedback ----------
  function wireFeedback(currentQuery){
    $("#fbAccurate").onclick = () => {
      bumpFeedback(currentQuery, "accurate");
    };
    $("#fbOff").onclick = () => {
      bumpFeedback(currentQuery, "off");
    };
    $("#fbSurprising").onclick = () => {
      bumpFeedback(currentQuery, "surprising");
    };
  }
  function bumpFeedback(query, key){
    const fb = storage.get("psysymbol_feedback", {});
    const k = query.toLowerCase();
    fb[k] = fb[k] || { accurate:0, off:0, surprising:0 };
    fb[k][key]++;
    storage.set("psysymbol_feedback", fb);
  }

  // ---------- Helpers ----------
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // ---------- Interpret flow ----------
  async function interpret(){
    const q = userInput.value.trim();
    if (!q) return;
    const cacheKey = `${state.mode}:${state.depth?'d':'s'}:${q.toLowerCase()}`;

    let output = state.cache[cacheKey];
    let enrichment = "";
    if (!output){
      output = coreInterpreter.interpret(q, state.mode, state.depth, contextEngine.analyze(q, state.mode));
      state.cache[cacheKey] = output;
      storage.set("psysymbol_cache", state.cache);
    }

    if (state.enrich){
      enrichment = await enrichFromWeb(q, state.mode);
    }

    const related = suggestRelated(q, state.mode);
    displayResult(output, related, enrichment);

    // record history
    storage.push("psysymbol_history", {
      ts: nowISO(), mode: state.mode, query: q, output, related, enrichment: !!enrichment
    });
    renderHistory();
    updateCloud(q);
    wireFeedback(q);
  }

  // ---------- Event wiring ----------
  modeTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    setMode(tab.dataset.mode);
  });

  interpretBtn.addEventListener("click", interpret);
  clearBtn.addEventListener("click", () => { userInput.value = ""; userInput.focus(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement === userInput) interpret();
    if (e.key === "Escape"){ userInput.value = ""; }
  });

  depthToggle.checked = !!state.depth;
  enrichToggle.checked = !!state.enrich;
  depthToggle.addEventListener("change", () => {
    state.depth = depthToggle.checked;
    storage.set("psysymbol_depth", state.depth);
  });
  enrichToggle.addEventListener("change", () => {
    state.enrich = enrichToggle.checked;
    storage.set("psysymbol_enrich", state.enrich);
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("psysymbol_history");
    renderHistory();
  });

  logo.addEventListener("click", () => {
    // reset to clean state & Dream
    userInput.value = "";
    setMode("dream");
    resultEl.textContent = "Enter something above and tap Interpret.";
    resultEl.classList.add("muted");
    relatedEl.innerHTML = "";
  });

  // ---------- Aggregator Beta (placeholder) ----------
  // Uses the cache + feedback to highlight consensus terms locally
  function aggregatorInsight(){
    const fb = storage.get("psysymbol_feedback", {});
    const terms = Object.entries(fb).map(([term, stats]) => {
      const score = (stats.accurate || 0) - (stats.off || 0) + (stats.surprising || 0)*0.5;
      return { term, score };
    }).sort((a,b)=>b.score-a.score).slice(0,10);
    if (!terms.length) return;
    const line = "Trending locally: " + terms.map(t => `${t.term} (${t.score>0?'+':''}${t.score.toFixed(1)})`).join(" · ");
    const div = document.createElement("div");
    div.className = "hint";
    div.style.marginTop = "6px";
    div.textContent = line;
    $("#cloud").parentElement.appendChild(div);
  }

  // ---------- Init ----------
  setMode(state.mode);
  renderHistory();
  renderCloud();
  aggregatorInsight();
})();