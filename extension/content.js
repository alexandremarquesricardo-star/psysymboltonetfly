(()=>{
  const TERMS = ["lion","snake","mirror","111","222","333","444","555","777"];
  const bodyText = document.body.innerText || "";
  const found = TERMS.filter(t=>bodyText.toLowerCase().includes(t.toLowerCase()));
  if(!found.length) return;
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;bottom:12px;right:12px;background:#111a;backdrop-filter:blur(6px);color:#fff;padding:10px 12px;border-radius:10px;border:1px solid #334;z-index:999999;font:13px/1.4 system-ui;";
  bar.innerHTML = `<b>PsySymbol</b> — decode: ${found.map(f=>`<a style="color:#8cf" target="_blank" rel="noopener" href="https://psysymbol.com/#/interpret?m=symbol&q=${encodeURIComponent(f)}">${f}</a>`).join(" · ")}`;
  document.body.appendChild(bar);
  setTimeout(()=>bar.remove(), 10000);
})();