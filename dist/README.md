# PsySymbol — Phase 2.1 (PWA Add‑Ons)

This bundle upgrades the Phase‑2 single‑file build with **PWA** support while keeping the core logic intact.

## Files
- `index.html` — Updated with manifest + SW registration.
- `manifest.webmanifest` — PWA metadata (name, icons, theme).
- `service-worker.js` — Offline cache for core assets; network‑first for APIs.
- `favicon.svg` — Gradient Ψ icon.

## Deploy (GitHub Pages)
1. Commit these files to the root of your `gh-pages` branch (or `main` if Pages serves from root).
2. Ensure your Pages **Custom Domain** points to `psysymbol.com` (or use the repo URL).
3. SW path is relative (`./service-worker.js`), so it works at root or subfolder.

## Notes
- Enrichment uses Wikipedia REST and Numbers API; SW leaves those network‑first.
- If you change paths, update the `STATIC_ASSETS` list and the registration path in `index.html`.
