// Client-side sitemap builder for PsySymbol
(() => {
  // Collect locally known terms from history, favorites, and cloud, then offer a download of sitemap.xml
  function collectTerms(){
    const get = (k)=>{ try{ return JSON.parse(localStorage.getItem(k))||[] }catch{ return [] } };
    const history = get("psysymbol_history");
    const favs = Object.values(JSON.parse(localStorage.getItem("psysymbol_favorites")||"{}"));
    const cloud = JSON.parse(localStorage.getItem("psysymbol_cloud")||"{}");
    const terms = new Set();
    history.forEach(it => terms.add(`${it.mode}:${it.query.toLowerCase()}`));
    favs.forEach(it => terms.add(`${it.mode}:${it.query.toLowerCase()}`));
    Object.keys(cloud).forEach(k => terms.add(`symbol:${k}`)); // assume symbol for cloud entries
    return Array.from(terms);
  }

  function buildSitemap(){
    const terms = collectTerms();
    const base = location.origin + location.pathname.replace(/\\/index\\.html?$/,"");
    const urls = terms.map(t => {
      const [m,q] = t.split(":");
      const loc = `${base}#/interpret?m=${encodeURIComponent(m)}&q=${encodeURIComponent(q)}`;
      return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`;
    }).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
    return xml;
  }

  // Expose button if needed
  document.addEventListener("DOMContentLoaded", () => {
    const footer = document.querySelector("footer .muted");
    if (!footer) return;
    const btn = document.createElement("button");
    btn.textContent = "Download sitemap.xml";
    btn.className = "pill";
    btn.style.marginLeft = "8px";
    btn.onclick = () => {
      const blob = new Blob([buildSitemap()], {type: "application/xml"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "sitemap.xml"; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    };
    footer.parentElement.appendChild(btn);
  });
})();