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
├── scripts/
│   ├── generate-city-pages.js
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
