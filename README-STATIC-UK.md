# Mother's Day UK - Static site (UK only)

SEO-optimised static landing for Mother's Day 2026 in the UK. Built with HTML/CSS and minimal JavaScript (Glide.js for carousels). No Next.js; Nginx serves static files.

## Quick start

```bash
# Local development
npx serve .

# Or with Python
python -m http.server 8080
```

Open http://localhost:3000 (serve) or http://localhost:8080 (Python).

## Build (before deploy)

```powershell
# Optional: install minification tools
npm install -g terser clean-css-cli

# Run build: combine CSS, minify CSS/JS, regenerate city pages
.\scripts\build-static.ps1

# Full build including refresh from Fever (requires Playwright)
.\scripts\build-static.ps1 -RefreshFever
```

Manual steps (README template):

1. **Combine CSS** (if not using build script):  
   `Get-Content css/variables.css, css/fonts.css, css/glide.core.min.css, css/styles.css, css/animations.css | Set-Content css/bundle.css`

2. **Minify CSS:**  
   `cleancss -o css/bundle.min.css css/bundle.css`

3. **Minify JS:**  
   `terser js/main.js -o js/main.min.js -c -m`

4. **Download Glide.js** (self-host):  
   `curl -o js/glide.min.js https://cdn.jsdelivr.net/npm/@glidejs/glide@3.6.1/dist/glide.min.js`

5. **Regenerate city pages:**  
   `node scripts/generate-city-pages.js`

### City page plans from Fever (single source of truth)

All plans shown on city pages (index, ideas, experiences, events, candlelight) come from **Fever's Mother's Day landing**: `https://feverup.com/en/{city}/mothers-day`. Data is read from `data/fever-plans-uk.json`.

- **Data structure:** Per city, `experiences` (plan cards) and `giftCards` (gift card carousel). Each item has `name`, `url`, `priceText`, and optionally `image` (Fever image URL).
- **Images:** The generator uses `plan.image` when present (Fever URLs) so cards show the same images as on Fever; if missing, it falls back to the city image (e.g. `images/london.png`).
- **Refresh from Fever (manual):** Run `npm run fetch-fever-plans` (requires Playwright: `npx playwright install chromium`). It scrapes experiences and gift cards from each city's Mother's Day page and overwrites `data/fever-plans-uk.json`. Then run `node scripts/generate-city-pages.js` to regenerate HTML. Or run a full build: `.\scripts\build-static.ps1 -RefreshFever`.
- **Automation:** A GitHub Actions workflow (`.github/workflows/sync-fever-plans.yml`) runs on a schedule (e.g. twice daily) and on demand (workflow_dispatch). It runs fetch + generate, then commits and pushes changes to `main`. When plans are added or changed on Fever, the next sync updates the repo; the existing Cloud Build trigger on push to `main` then deploys the site with fresh data.
- **Fallbacks:** If a city has no experiences, the generator shows generic "Top picks" linking to Fever. If there are no gift cards, it uses a small hardcoded list (names/prices) linking to the Mother's Day page.

## Project structure

```
├── index.html              # Home – city selector UK
├── london/, manchester/, …  # One folder per city (index.html)
├── legal/cookies.html
├── css/
│   ├── variables.css, styles.css, animations.css, fonts.css
│   ├── glide.core.min.css
│   ├── bundle.css, bundle.min.css
├── js/
│   ├── main.js, main.min.js
│   └── glide.min.js        # Download via build or curl
├── images/                  # WebP + srcset; favicon here
├── fonts/                   # Self-hosted Inter (optional)
├── data/uk-cities.json      # UK cities list
├── .github/workflows/
│   └── sync-fever-plans.yml # Scheduled sync from Fever + regenerate
├── scripts/
│   ├── generate-city-pages.js
│   ├── fetch-fever-plans.js
│   └── build-static.ps1
├── nginx.conf
├── Dockerfile
├── sitemap.xml
└── robots.txt
```

## Docker

```bash
docker build -t mothers-day-uk .
docker run -p 8080:8080 mothers-day-uk
```

Then open http://localhost:8080

## Deploy (Cloud Run)

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/mothers-day-uk
gcloud run deploy mothers-day-uk \
  --image gcr.io/PROJECT_ID/mothers-day-uk \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated
```

Set domain (e.g. celebratemothersday.co.uk) in Cloud Run → Domain mappings.

## UK only

- **Language:** English (en-GB) only.
- **Cities:** London, Manchester, Birmingham only. Per city: main (/city/), ideas, experiences, events, candlelight.
- **Domain:** celebratemothersday.co.uk.
- **Country keywords:** mothers day uk, mothers day ideas, mothers day experiences. City pages target mothers day [city], things to do, plans, ideas, experiences, events, candlelight.

## Tech (from README template)

- CSS/JS minification (cleancss, terser).
- Glide.js self-hosted (no CDN).
- Hero height: `min(1080px, 100vh)` / `100dvh` for crawlers.
- Self-hosted fonts with `font-display: optional`.
- Cache 30 days for static assets (nginx).
- JSON-LD, sitemap, robots.txt, canonical URLs.
