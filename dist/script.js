(()=>{const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));const nowISO=()=>new Date().toISOString();
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){localStorage.setItem(k,JSON.stringify(v))},push(k,item){const a=storage.get(k,[]);a.unshift(item);storage.set(k,a.slice(0,400));}};
const body=document.body,modeTabs=$("#modeTabs"),userInput=$("#userInput"),interpretBtn=$("#interpretBtn"),clearBtn=$("#clearBtn"),titleOut=$("#titleOut"),metaLine=$("#metaLine"),resultEl=$("#result"),seeAlsoEl=$("#seeAlso"),badgesEl=$("#sourceBadges"),sourcesList=$("#sourcesList"),copyPermalink=$("#copyPermalink"),expandBtn=$("#expandMeaning"),historyEl=$("#history"),clearHistory=$("#clearHistory"),cloudEl=$("#cloud");
const depthBtn=$("#depthBtn"),enrichBtn=$("#enrichBtn"),depthState=$("#depthState"),enrichState=$("#enrichState"),logo=$("#logo");
const trendBars=$("#trendBars");
const shareImageBtn=$("#shareImage");
let state={mode:storage.get("psysymbol_mode","dream"),depth:storage.get("psysymbol_depth",false),enrich:storage.get("psysymbol_enrich",false),cache:storage.get("psysymbol_cache",{}),lastOutput:null,lastQuery:"",corpus:null};

function setMode(m){state.mode=m;storage.set("psysymbol_mode",m);body.classList.remove("mode-dream","mode-symbol","mode-number");body.classList.add(`mode-${m}`);
  $$(".tab",modeTabs).forEach(t=>{t.classList.toggle("active",t.dataset.mode===m);t.setAttribute("aria-selected",t.dataset.mode===m?"true":"false")});
  if(userInput){userInput.placeholder=m==="dream"?"Describe a dream… (e.g., 'falling into water')":m==="symbol"?"Name a symbol… (e.g., 'lion', 'mirror')":"Type a number… (e.g., '333', '11:11')";}
}
function syncToggles(){if(depthState)depthState.textContent=state.depth?"On":"Off";if(enrichState)enrichState.textContent=state.enrich?"On":"Off";}
const SOURCE_SNIPPETS={Jungian:"Jungian perspective: the symbol speaks for a balancing movement in the psyche.",Mythic:"Mythic thread: echoes in folklore and ritual across cultures.",Cultural:"Cultural lens: meanings shaped by time, place, and language.",Numerical:"Numerical angle: repetition, reduction, and pattern significance."};
function tagSources(m){if(m==="symbol")return["Jungian","Mythic","Cultural"];if(m==="dream")return["Jungian","Cultural"];return["Numerical","Cultural"];}
const contextEngine={analyze(text,mode){const t=(text||"").toLowerCase();const f=[];if(t.includes("water"))f.push("emotion, flow, subconscious");if(t.includes("fall"))f.push("loss of control, surrender");if(/\b\d{2,}\b/.test(t)||mode==="number")f.push("numerology, pattern");if(t.includes("chased"))f.push("anxiety, avoidance");if(t.includes("teeth"))f.push("appearance, vulnerability");if(t.includes("mirror"))f.push("self-image, reflection");if(t.includes("lion"))f.push("courage, leadership, pride");return{facets:f}}};
const coreInterpreter={interpret(text,mode,depth,personalTone){const base=(text||"").trim();if(!base)return"Please type something to interpret.";const {facets}=contextEngine.analyze(base,mode);const b=[];if(mode==="dream"){b.push(`Theme: ${facets[0]??"personal narrative & emotion"}`);b.push(`Processing: ${facets.slice(1,3).join(" · ")||"recent change or latent wish"}`);if(personalTone)b.push(`Personal motif: ${personalTone}`);if(depth){b.push("Shadow: what are you avoiding or denying?");b.push("Action: note one feeling on waking + one tiny change to try today.")}}else if(mode==="symbol"){b.push(`Core meaning: ${facets[0]??"archetypal energy"}`);b.push("Light: growth, guidance, alignment.");b.push("Dark: excess, fixation, imbalance.");if(personalTone)b.push(`Your pattern: ${personalTone}`);if(depth)b.push("Practice: log the symbol for 3 days — where/when it appears.")}else{const rep=/(\d)\1{1,}/.test(base);b.push(`Numerology: ${rep?"repeating/master pattern":"sum & reduction"}`);if(personalTone)b.push(`Resonance: ${personalTone}`);if(depth)b.push("Prompt: 5-minute journal — earliest memory of this number.")}return "• "+b.join("\n• ")}};

async function loadCorpus(){try{const r=await fetch("data/corpus.json");if(r.ok){state.corpus=await r.json()}}catch{}}
function getKind(){return state.mode==="dream"?"archetypes":(state.mode==="symbol"?"symbols":"numbers")}
function lookup(q){if(!state.corpus)return null;const list=state.corpus[getKind()]||[];const k=(q||"").toLowerCase().trim();return list.find(e=>(e.term||"").toLowerCase()===k)||null}
function renderSeeAlso(terms){seeAlsoEl.innerHTML="";if(!terms||!terms.length)return;const label=document.createElement("span");label.className="muted";label.textContent="See also:";seeAlsoEl.appendChild(label);for(const t of terms){const b=document.createElement("button");b.className="tag";b.textContent=t;b.onclick=()=>{userInput.value=t;interpret()};seeAlsoEl.appendChild(b)}}
function updateSEO(mode,q,desc){const canonical=location.origin+location.pathname+`#/interpret?m=${encodeURIComponent(mode)}&q=${encodeURIComponent(q)}`;$("#canonicalLink").setAttribute("href",canonical);$("#ogUrl").setAttribute("content",canonical);$("#ogTitle").setAttribute("content",`PsySymbol — ${mode.toUpperCase()}: ${q}`);const d=(desc||"").slice(0,160)||"Archetypal meanings with Jungian psychology & numerology.";$("#ogDesc").setAttribute("content",d);$("#metaDesc").setAttribute("content",d);const jsonld={"@context":"https://schema.org","@type":mode==="number"?"Thing":"CreativeWork","name":`${mode.toUpperCase()}: ${q}`,"description":d,"inLanguage":"en","dateModified":new Date().toISOString()};$("#jsonld").textContent=JSON.stringify(jsonld,null,2)}

const EXPAND_BLOCK_ID="expandBlock";function removeExpand(){const el=document.getElementById(EXPAND_BLOCK_ID);if(el)el.remove();if(expandBtn)expandBtn.textContent="Expand meaning"}
function expansionThreads(mode,q){const p=[];if(mode==="symbol"){p.push("Jungian depth: how does this image compensate your conscious stance?");p.push("Cross-culture: compare at least two traditions; where does the meaning shift?");p.push("Practice: track 3 appearances; note feeling-tone each time.")}else if(mode==="dream"){p.push("Projection check: which dream figures carry your disowned qualities?");p.push("Somatic: name the first body sensation on waking.");p.push("Ritual: one tiny action that honors what the dream asks.")}else{p.push("Number ladder: reduce to a digit; compare with the unreduced pattern.");p.push("Notebook: log where it appears for 3 days; note the theme present.")}return "▼ Expanded threads\n"+p.map(x=>"• "+x).join("\n")}
expandBtn&& (expandBtn.onclick=()=>{if(!state.lastQuery)return;const ex=document.getElementById(EXPAND_BLOCK_ID);if(ex){removeExpand();return}const pre=document.createElement("pre");pre.id=EXPAND_BLOCK_ID;pre.className="result";pre.textContent=expansionThreads(state.mode,state.lastQuery);resultEl.parentElement.appendChild(pre);expandBtn.textContent="Collapse"});

function displayBadges(tags){badgesEl.innerHTML="";for(const t of tags){const b=document.createElement("span");b.className="badge";b.dataset.type=t;b.textContent=t;badgesEl.appendChild(b)}sourcesList.innerHTML=tags.map(t=>`— <b>${t}</b>: ${SOURCE_SNIPPETS[t]||""}`).join("<br>")}

function personalContext(){const entries = storage.get("psysymbol_journal", []).slice(0,50).map(e=>e.text.toLowerCase());
  const hist = storage.get("psysymbol_history", []).slice(0,200).map(h=>h.query.toLowerCase());
  const text = entries.join(" ")+" "+hist.join(" "); if(!text.trim()) return null;
  const stop = new Set("the a an and or but with into onto from in on at by for of to is are was were be have has had i you me my your we they them our us it this that those these as if not no yes".split(" "));
  const counts = {}; text.replace(/[^a-z0-9\s]/g," ").split(/\s+/).forEach(w=>{ if(!w||stop.has(w)||w.length<3) return; counts[w]=(counts[w]||0)+1; });
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([w])=>w);
  const motifs = top.join(", "); return motifs ? `recurring motifs — ${motifs}` : null; }

async function interpret(){const q=(userInput.value||"").trim();if(!q)return;if(/^\d+([:.-]\d+)?$/.test(q)&&state.mode!=="number"){setMode("number")}
  const k=`${state.mode}:${state.depth?'d':'s'}:${q.toLowerCase()}`;let out=state.cache[k];
  if(!out){out=coreInterpreter.interpret(q,state.mode,state.depth, personalContext());state.cache[k]=out;storage.set("psysymbol_cache",state.cache)}
  const entry=lookup(q);metaLine.textContent=entry?.meta||"";renderSeeAlso(entry?.see||[]);titleOut&&(titleOut.textContent=`${state.mode.toUpperCase()}: ${q}`);
  resultEl.classList.remove("muted");resultEl.textContent=out;
  displayBadges(tagSources(state.mode));$("#sourcesBlock").open=true;state.lastOutput=out;state.lastQuery=q;showDeepRead(q,state.mode);showAmazonShelf(state.mode);
  storage.push("psysymbol_history",{ts:nowISO(),mode:state.mode,query:q,output:out});updateSEO(state.mode,q,entry?.meta||out);
  const url=location.origin+location.pathname+`#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(q)}`;
  copyPermalink&&(copyPermalink.onclick=async()=>{try{await navigator.clipboard.writeText(url);copyPermalink.textContent="Copied ✓";setTimeout(()=>copyPermalink.textContent="Copy Permalink",1200)}catch{}});
  location.hash=`#/interpret?m=${encodeURIComponent(state.mode)}&q=${encodeURIComponent(q)}`}

function weeklyTrending(){const items=storage.get("psysymbol_history",[]);const cutoff=Date.now()-604800000;const c={};for(const it of items){if(new Date(it.ts).getTime()>=cutoff){const k=it.query.toLowerCase();c[k]=(c[k]||0)+1}}return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,20)}
function renderTrending(){const list=$("#trendingList");if(!list)return;const top=weeklyTrending();list.innerHTML="";if(!top.length){list.innerHTML="<li class='muted'>No local searches this week yet.</li>";return}top.forEach(([term,n])=>{const li=document.createElement("li");const a=document.createElement("a");a.href="#/";a.textContent=`${term} (${n})`;a.onclick=(e)=>{e.preventDefault();routeTo("#/");userInput.value=term;interpret()};li.appendChild(a);list.appendChild(li)})}
function renderDashboard(){ if(!trendBars) return; trendBars.innerHTML=""; const top=weeklyTrending().slice(0,10); const max= top.length? top[0][1] : 1; top.forEach(([term,n])=>{ const bar=document.createElement("div"); bar.className="bar"; bar.style.width = Math.max(10, Math.round((n/max)*100))+'%'; const span=document.createElement("span"); span.textContent = `${term} — ${n}`; bar.appendChild(span); trendBars.appendChild(bar); }); if(!top.length){ trendBars.innerHTML = "<div class='muted'>No data yet. Search a few symbols to populate.</div>"; } }

function pseudoRandomPick(seed,arr){let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;return arr[h%arr.length]}
function renderToday(){const out=$("#todayOut");if(!out||!state.corpus)return;const dateStr=new Date().toISOString().slice(0,10);const symbols=state.corpus.symbols?.map(e=>e.term)||["lion","snake","mirror"];const numbers=state.corpus.numbers?.map(e=>e.term)||["111","222","333"];const type=(new Date().getDate()%2===0)?"symbol":"number";const pick=type==="symbol"?pseudoRandomPick(dateStr,symbols):pseudoRandomPick(dateStr,numbers);const meaning=coreInterpreter.interpret(pick,type,true, personalContext());out.innerHTML=`<b>${type.toUpperCase()} of the Day — ${pick}</b>\n\n${meaning}`}

function renderHistory(){const items=storage.get("psysymbol_history",[]);historyEl.innerHTML="";items.slice(0,50).forEach(it=>{const d=document.createElement("div");d.className="history-item";d.textContent=`${it.mode.toUpperCase()}: ${it.query}`;d.onclick=()=>{setMode(it.mode);userInput.value=it.query;interpret()};historyEl.appendChild(d)})}
clearHistory&&(clearHistory.onclick=()=>{storage.set("psysymbol_history",[]);renderHistory()});

function bumpCloud(term){const cloud=storage.get("psysymbol_cloud",{});const k=(term||"").toLowerCase();cloud[k]=(cloud[k]||0)+1;storage.set("psysymbol_cloud",cloud);renderCloud()}
function renderCloud(){const cloud=storage.get("psysymbol_cloud",{});const items=Object.entries(cloud).sort((a,b)=>b[1]-a[1]).slice(0,30);cloudEl.innerHTML="";items.forEach(([term,n])=>{const b=document.createElement("button");b.className="tag";b.textContent=`${term} (${n})`;b.onclick=()=>{userInput.value=term;interpret()};cloudEl.appendChild(b)})}

// Deep Read
function escDR(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clearDeepRead(){const c=$("#deep-read-container");if(c){c.hidden=true;c.innerHTML=""}const s=$("#amazon-shelf-container");if(s){s.hidden=true;s.innerHTML=""}}
const SPA_AFFILIATE_TAG="psysymbol-21";
const SPA_BOOKS={
  dream:[{t:"Man and His Symbols",a:"Carl Jung",q:"man and his symbols jung"},{t:"Inner Work",a:"Robert A. Johnson",q:"inner work robert johnson dreams"},{t:"The Interpretation of Dreams",a:"Sigmund Freud",q:"interpretation of dreams freud"}],
  symbol:[{t:"The Book of Symbols",a:"ARAS / Taschen",q:"book of symbols taschen aras"},{t:"A Dictionary of Symbols",a:"J. E. Cirlot",q:"dictionary of symbols cirlot"},{t:"Man and His Symbols",a:"Carl Jung",q:"man and his symbols jung"}],
  number:[{t:"The Complete Book of Numerology",a:"David A. Phillips",q:"complete book of numerology david phillips"},{t:"Numerology and the Divine Triangle",a:"Faith Javane",q:"numerology divine triangle javane"},{t:"Angel Numbers",a:"Kyle Gray",q:"angel numbers kyle gray"}]
};
function showAmazonShelf(mode){
  const c=$("#amazon-shelf-container");if(!c)return;
  const picks=SPA_BOOKS[mode];if(!picks){c.hidden=true;c.innerHTML="";return}
  c.hidden=false;c.className="reading-shelf";
  c.innerHTML=`
    <h2>Related reading</h2>
    <p class="muted">If you want to go deeper than any single page can, these are the books we keep returning to.</p>
    <div class="reading-shelf__items">
      ${picks.map(p=>`
        <a class="reading-shelf__item" href="https://www.amazon.co.uk/s?k=${encodeURIComponent(p.q)}&tag=${SPA_AFFILIATE_TAG}" target="_blank" rel="sponsored noopener">
          <div class="reading-shelf__title">${escDR(p.t)}</div>
          <div class="reading-shelf__author muted">${escDR(p.a)}</div>
        </a>
      `).join("")}
    </div>
    <p class="reading-shelf__disclosure">As an Amazon Associate we earn from qualifying purchases at no cost to you. Links open Amazon UK in a new tab. See our <a href="/privacy.html#affiliates">affiliate disclosure</a>.</p>
  `;
}
function showDeepRead(topic,mode){
  const c=$("#deep-read-container");if(!c)return;
  const apiMode=mode==="dream"||mode==="symbol"||mode==="number"?mode:"symbol";
  c.hidden=false;
  c.className="deep-read";
  c.innerHTML=`
    <h2>Want a personalised Deep Read of ${escDR(topic)}?</h2>
    <p class="muted">The result above is the templated reading. The Deep Read is the upgrade — a fresh interpretation written for you, optionally tailored to anything specific about your experience. Powered by Claude Haiku.</p>
    <button class="deep-read__trigger" type="button">Get a Deep Read</button>
    <div class="deep-read__panel" hidden>
      <label class="deep-read__label" for="dr-context">Anything specific about your experience? <span class="muted">(optional)</span></label>
      <textarea id="dr-context" class="deep-read__context" rows="3" maxlength="2000" placeholder="e.g. I keep dreaming this on Sunday nights"></textarea>
      <div class="deep-read__actions">
        <button class="deep-read__submit" type="button">Generate Deep Read</button>
        <span class="muted deep-read__limit">~5 free per day · nothing is saved</span>
      </div>
      <div class="deep-read__output" hidden></div>
    </div>`;
  const trigger=c.querySelector(".deep-read__trigger");
  const panel=c.querySelector(".deep-read__panel");
  const submit=c.querySelector(".deep-read__submit");
  const ctxEl=c.querySelector(".deep-read__context");
  const out=c.querySelector(".deep-read__output");
  trigger.onclick=()=>{panel.hidden=false;trigger.hidden=true;ctxEl.focus()};
  submit.onclick=async()=>{
    submit.disabled=true;submit.textContent="Generating…";
    out.hidden=false;out.textContent="";out.classList.remove("deep-read__output--error");
    try{
      const resp=await fetch("/api/deep-read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,mode:apiMode,text:ctxEl.value})});
      const reader=resp.body.getReader();const dec=new TextDecoder();let buf="",done=false;
      while(!done){
        const ch=await reader.read();if(ch.done)break;
        buf+=dec.decode(ch.value,{stream:true});
        const evs=buf.split("\n\n");buf=evs.pop()??"";
        for(const ev of evs){
          if(!ev.startsWith("data: "))continue;
          const raw=ev.slice(6).trim();
          if(raw==="[DONE]"){done=true;break}
          try{
            const p=JSON.parse(raw);
            if(p.text)out.textContent+=p.text;
            else if(p.error){out.textContent=p.error;out.classList.add("deep-read__output--error");done=true;break}
          }catch(_){}
        }
      }
    }catch(_){
      out.textContent="Something went wrong reaching the Deep Read service. Please try again in a moment.";
      out.classList.add("deep-read__output--error");
    }finally{
      submit.disabled=false;submit.textContent="Generate another";
    }
  };
}

// Routing
function routeTo(hash){$$("#view-home, #view-today, #view-trending, #view-dashboard").forEach(v=>v.classList.remove("active"));
if(hash.startsWith("#/today")){$("#view-today").classList.add("active");renderToday()}
else if(hash.startsWith("#/trending")){$("#view-trending").classList.add("active");renderTrending()}
else if(hash.startsWith("#/dashboard")){$("#view-dashboard").classList.add("active");renderDashboard()}
else{$("#view-home").classList.add("active");renderHistory();renderCloud()}
if(hash.startsWith("#/interpret")){const p=new URLSearchParams(hash.split("?")[1]||"");const m=p.get("m");const q=p.get("q")||"";if(m)setMode(m);if(q){userInput.value=q;interpret()}}}
window.addEventListener("hashchange",()=>routeTo(location.hash||"#/"));

// Share image
function downloadURI(uri, name){const link=document.createElement("a");link.download=name;link.href=uri;document.body.appendChild(link);link.click();link.remove()}
function drawShareCard(title,text){const c=document.createElement("canvas");const W=1200,H=630; c.width=W; c.height=H; const ctx=c.getContext("2d");
const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,"#0e1630"); g.addColorStop(1,"#1a2246"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
ctx.fillStyle="#fff"; ctx.font="bold 64px system-ui,Segoe UI,Roboto"; ctx.fillText(title.slice(0,40), 60, 140);
ctx.fillStyle="#c9d4ff"; ctx.font="28px system-ui,Segoe UI,Roboto";
const words=text.replace(/\s+/g," ").trim().split(" "); let line=""; let y=200; const maxW=W-120; const lines=[];
for(const w of words){ const test=line+w+" "; if(ctx.measureText(test).width>maxW){ lines.push(line.trim()); line=w+" "; } else { line=test; } if(lines.length>=7) break; }
lines.push(line.trim()); for(const ln of lines){ ctx.fillText(ln,60,y); y+=44; }
ctx.fillStyle="#8aa0ff"; ctx.font="22px system-ui,Segoe UI,Roboto"; ctx.fillText("psysymbol.com  ·  Ψ", 60, H-60);
return c.toDataURL("image/png")}
shareImageBtn&& (shareImageBtn.onclick=()=>{ if(!state.lastQuery||!state.lastOutput){alert("Generate an interpretation first.");return;} const title=`${state.mode.toUpperCase()}: ${state.lastQuery}`; const essence=(state.lastOutput||"").replace(/^•\s*/gm,"").slice(0,280); const uri=drawShareCard(title, essence); downloadURI(uri, "psysymbol-share.png"); });

// Toggle handlers
depthBtn&& depthBtn.addEventListener("click",()=>{state.depth=!state.depth;storage.set("psysymbol_depth",state.depth);syncToggles(); if(state.lastQuery){interpret()}});
enrichBtn&& enrichBtn.addEventListener("click",()=>{state.enrich=!state.enrich;storage.set("psysymbol_enrich",state.enrich);syncToggles(); if(state.lastQuery){interpret()}});

// Mode tabs
modeTabs&& modeTabs.addEventListener("click",(e)=>{const tab=e.target.closest(".tab");if(!tab)return;setMode(tab.dataset.mode)});

// Logo reset → home + dream + clear history/cloud
logo&& logo.addEventListener("click",()=>{
  location.hash="#/";
  setMode("dream");
  userInput.value="";
  titleOut.textContent="Interpretation";
  metaLine.textContent="";
  resultEl.classList.add("muted");
  resultEl.textContent="Enter something above and tap Interpret.";
  removeExpand();
  clearDeepRead();
  localStorage.setItem("psysymbol_history", JSON.stringify([]));
  localStorage.setItem("psysymbol_cloud", JSON.stringify({}));
  const evt = new Event("hashchange");
  window.dispatchEvent(evt);
});

// Buttons & keys
interpretBtn.addEventListener("click",()=>{interpret();bumpCloud((userInput.value||"").trim())});
clearBtn.addEventListener("click",()=>{userInput.value="";userInput.focus()});
document.addEventListener("keydown",(e)=>{if(e.key==="Enter"&&document.activeElement===userInput)interpret();if(e.key==="Escape"){userInput.value=""}});

// PWA registration
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}

// Boot
async function boot(){await loadCorpus();setMode(state.mode);syncToggles();routeTo(location.hash||"#/");} boot();})();