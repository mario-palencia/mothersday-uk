# Mother's Day UK – Static site (UK only)

Static landing for **Mother's Day 2026** in the UK. HTML/CSS and minimal JavaScript (Glide.js). Served by Nginx; no Next.js.

- **Scope:** UK only. Cities: London, Manchester, Birmingham. Per city: main page, ideas, experiences, events, candlelight.
- **Language:** English (en-GB) only.
- **Domain:** celebratemothersday.co.uk (or your UK domain).

## Quick start

```bash
npx serve .
# Open http://localhost:3000
```

## Build and deploy

See **[README-STATIC-UK.md](README-STATIC-UK.md)** for:

- Build steps (bundle CSS, minify JS, regenerate city pages)
- Project structure
- Docker and Cloud Run deploy
- Tech rules (hero min(1080px,100vh), self-hosted fonts, cache 30 days, etc.)

## Archived

- **src-archive/** – Previous Next.js/React app (kept for reference).
- **next.config.js.bak** – Previous Next.js config.

The live site is static only: `index.html`, city folders (`london/`, `manchester/`, …), `css/`, `js/`, `images/`, `legal/`, `sitemap.xml`, `robots.txt`.
