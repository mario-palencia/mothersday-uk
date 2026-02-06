/**
 * Generate static HTML city pages for a campaign (config-driven).
 * Run: node scripts/generate-city-pages.js [--campaign=mothers-day]
 * Or: CAMPAIGN=mothers-day node scripts/generate-city-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'uk-cities.json');
const CAMPAIGNS_DIR = path.join(ROOT, 'data', 'campaigns');

let FEVER_PLANS_PATH = path.join(ROOT, 'data', 'fever-plans-uk.json');
let DOMAIN = 'https://celebratemothersday.co.uk';

/**
 * @typedef {{ name: string, url?: string, priceText?: string, image?: string }} FeverPlan
 * @typedef {{ experiences: FeverPlan[], giftCards: FeverPlan[], candlelightExperiences?: FeverPlan[] }} CityPlans
 * @typedef {{ [citySlug: string]: CityPlans }} FeverPlansData
 */

function getCampaignId() {
  const arg = process.argv.find((a) => a.startsWith('--campaign='));
  if (arg) return arg.split('=')[1];
  return process.env.CAMPAIGN || 'mothers-day';
}

function loadCampaignConfig(campaignId) {
  const configPath = path.join(CAMPAIGNS_DIR, campaignId + '.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Campaign config not found: ' + configPath);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Same favicon SVG (base64) as home
const FAVICON_SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iI0ZBRjBGMiIvPjxwYXRoIGZpbGw9IiMyRTVENEIiIGQ9Ik01MCA3NkwyNCA1MlEyMCAzOCAzMiAyOFE1MCAyMCA1MCAyMFE1MCAyMCA2OCAyOFE4MCAzOCA3NiA1MloiLz48L3N2Zz4=';

// Logo SVG same as home (for header/footer)
const LOGO_SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iI0ZBRjBGMiIvPjxwYXRoIGZpbGw9IiMyRTVENEIiIGQ9Ik01MCA3NkwyNCA1MlEyMCAzOCAzMiAyOFE1MCAyMCA1MCAyMFE1MCAyMCA2OCAyOFE4MCAzOCA3NiA1MloiLz48L3N2Zz4=';

// Fallback when fever-plans-uk.json is missing or empty (link to city listing)
const TOP_PICKS_FALLBACK = [
  { name: 'Afternoon Tea & Dining', url: null, priceText: 'See on Fever' },
  { name: 'Candlelight Concerts', url: null, priceText: 'See on Fever' },
  { name: 'Experience Gifts', url: null, priceText: 'See on Fever' }
];

// Fallback Gift Cards cuando no hay datos de Fever (solo nombres y precio genérico)
const GIFT_CARDS_FALLBACK = [
  { name: 'Candlelight Gift Card', priceText: 'From £25.00' },
  { name: 'Ballet of Lights - Gift Card', priceText: 'From £30.00' },
  { name: 'Experience Gifts - Gift Card', priceText: 'From £30.00' },
  { name: 'Themed Gift Cards', priceText: 'From £25.00' }
];

/**
 * Load Fever plans JSON. Returns object keyed by city slug with { experiences, giftCards, candlelightExperiences }.
 * @returns {FeverPlansData}
 */
function loadFeverPlans() {
  try {
    if (fs.existsSync(FEVER_PLANS_PATH)) {
      const data = JSON.parse(fs.readFileSync(FEVER_PLANS_PATH, 'utf8'));
      if (data && typeof data === 'object' && !Array.isArray(data)) return data;
      console.warn('Fever plans invalid structure: expected object keyed by city slug');
    } else {
      console.warn('Fever plans missing:', FEVER_PLANS_PATH);
    }
  } catch (e) {
    console.warn('Fever plans invalid or unreadable:', FEVER_PLANS_PATH, e.message);
  }
  return {};
}

/** Normaliza datos por ciudad: soporta formato antiguo (array) y nuevo ({ experiences, giftCards, candlelightExperiences }). */
function getCityPlans(feverPlans, citySlug) {
  const raw = feverPlans[citySlug];
  if (!raw) return { experiences: [], giftCards: [], candlelightExperiences: [] };
  if (Array.isArray(raw)) return { experiences: raw, giftCards: [], candlelightExperiences: [] };
  return {
    experiences: raw.experiences || [],
    giftCards: raw.giftCards || [],
    candlelightExperiences: raw.candlelightExperiences || []
  };
}

/** Meses para calcular días en rango (año no disponible, se usa mes relativo). */
const MONTH_DAYS = { Jan: 31, Feb: 28, Mar: 31, Apr: 30, May: 31, Jun: 30, Jul: 31, Aug: 31, Sep: 30, Oct: 31, Nov: 30, Dec: 31 };
const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthToDays(mon) {
  const i = MONTH_ORDER.indexOf(mon);
  return i >= 0 ? i * 31 : 0;
}

/** Aproximación de días entre "DD Mon" y "DD Mon" (sin año). */
function approxDaysBetween(d1, mon1, d2, mon2) {
  const start = monthToDays(mon1) + (d1 | 0);
  const end = monthToDays(mon2) + (d2 | 0);
  return Math.abs(end - start);
}

/**
 * Clasifica planes en events, experiences e ideas según heurísticas sobre name/priceText.
 * - Events: fecha única ("DD Mon From") o rango corto (≤45 días).
 * - Experiences: rango largo o sin fecha reconocible.
 * - Ideas: giftCards + planes "idea de regalo" (Gift, Package) o selección curada.
 * Un mismo plan puede estar en events y experiences.
 */
function classifyPlans(experiences, giftCards, candlelightExperiences) {
  const events = [];
  const experiencesList = [];
  const ideas = [...(giftCards || [])];

  const singleDateRe = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+From/i;
  const rangeRe = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*-\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  const openRangeRe = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*-\s*(?=\s|From|$)/i;
  const SHORT_RANGE_DAYS = 45;

  for (const p of experiences || []) {
    if (!p || !p.name) continue;
    const text = (p.name + ' ' + (p.priceText || '')).trim();
    const rangeMatch = text.match(rangeRe);
    const openMatch = text.match(openRangeRe);
    const singleMatch = !rangeMatch ? text.match(singleDateRe) : null;

    let isEvent = false;
    let isExperience = false;
    if (singleMatch) {
      isEvent = true;
    } else if (rangeMatch) {
      const days = approxDaysBetween(
        parseInt(rangeMatch[1], 10), rangeMatch[2],
        parseInt(rangeMatch[3], 10), rangeMatch[4]
      );
      if (days <= SHORT_RANGE_DAYS) {
        isEvent = true;
        isExperience = true;
      } else {
        isExperience = true;
      }
    } else if (openMatch) {
      isExperience = true;
    } else {
      isExperience = true;
    }

    if (isEvent) events.push(p);
    if (isExperience) experiencesList.push(p);
  }

  for (const p of experiences || []) {
    if (!p || !p.name) continue;
    const name = p.name.toLowerCase();
    const isGiftLike = /gift|package|experience\s*gift/i.test(name);
    if (isGiftLike && !ideas.some((i) => i.url === p.url && i.name === p.name)) ideas.push(p);
  }
  const ideaUrls = new Set(ideas.map((i) => i.url || i.name));
  let added = 0;
  const maxIdeasExtra = 8;
  for (const p of experiences || []) {
    if (!p || !p.name || ideaUrls.has(p.url) || ideaUrls.has(p.name)) continue;
    if (added >= maxIdeasExtra) break;
    ideas.push(p);
    ideaUrls.add(p.url || p.name);
    added++;
  }

  return { events, experiences: experiencesList, ideas };
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJson(s) {
  if (!s) return '';
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function layout(opts) {
  const { pageTitle, metaDescription, keywords, canonical, mainContent, assetDepth, city, stickyCtaUrl, stickyCtaText, breadcrumbList } = opts;
  const name = city.name;
  const slug = city.slug;
  const stickyCtaHtml = (stickyCtaUrl && stickyCtaText) ? `
  <div class="sticky-cta sticky-cta--city" aria-label="Book on Fever">
    <a href="${escapeHtml(stickyCtaUrl)}" class="sticky-cta__button cta-button" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(stickyCtaText)}">${escapeHtml(stickyCtaText)}</a>
  </div>` : '';
  const breadcrumbLdJson = (breadcrumbList && breadcrumbList.length > 0) ? `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${breadcrumbList.map((item, i) => `{"@type":"ListItem","position":${i + 1},"name":"${escapeJson(item.name)}","item":"${escapeJson(item.item || item.url || '')}"}`).join(',')}]}
  </script>` : '';
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <link rel="canonical" href="${canonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="preload" href="${assetDepth}css/bundle.min.css" as="style">
  <link rel="stylesheet" href="${assetDepth}css/bundle.min.css">
  <link rel="icon" type="image/svg+xml" href="${FAVICON_SVG}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${DOMAIN}/images/${slug}-og.jpg">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="en_GB">
  <meta property="og:site_name" content="Celebrate Mother's Day UK">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${DOMAIN}/images/${slug}-og.jpg">
  <meta name="theme-color" content="#2E5D4B">${breadcrumbLdJson}
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="top-bar" role="complementary" aria-label="Limited availability notice">
    <p class="top-bar__text">Places are filling up for Mother's Day — <a href="/#city-selector" class="top-bar__link">pick your city</a></p>
  </div>
  <header class="site-header" id="site-header" role="banner">
    <div class="container site-header__inner">
      <a href="/" class="site-header__logo" aria-label="Celebrate Mother's Day home">
        <img src="${LOGO_SVG}" alt="" class="site-header__logo-img" width="36" height="36">
        <span class="site-header__logo-text">Celebrate Mother's Day</span>
      </a>
      <nav class="site-header__nav" aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/#city-selector" class="site-header__cta cta-button" aria-label="Choose your city for Mother's Day">Pick your city</a>
      </nav>
    </div>
  </header>

  <main id="main-content" role="main">
    ${mainContent}
  </main>
${stickyCtaHtml}

  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="site-footer__top">
        <a href="/" class="site-footer__brand" aria-label="Celebrate Mother's Day home">
          <img src="${LOGO_SVG}" alt="" class="site-footer__logo" width="40" height="40">
          <span class="site-footer__name">Celebrate Mother's Day</span>
        </a>
        <nav class="site-footer__nav" aria-label="Footer navigation">
          <div class="site-footer__col">
            <span class="site-footer__label">Cities</span>
            <a href="/london/" title="Mother's Day London — ideas, gifts and things to do">Mother's Day London</a>
            <a href="/manchester/" title="Mother's Day Manchester — ideas, gifts and things to do">Mother's Day Manchester</a>
            <a href="/birmingham/" title="Mother's Day Birmingham — ideas, gifts and things to do">Mother's Day Birmingham</a>
          </div>
          <div class="site-footer__col">
            <span class="site-footer__label">Legal</span>
            <a href="/legal/cookies.html">Cookie Policy</a>
          </div>
        </nav>
      </div>
      <div class="site-footer__bottom">
        <p class="site-footer__copy">&copy; 2026 Celebrate Mother's Day. Operated by Fever Up Entertainment.</p>
      </div>
    </div>
  </footer>

  <div id="cookie-consent-banner" class="cookie-banner cookie-banner--hidden" role="dialog" aria-label="Cookie consent">
    <div class="cookie-banner__inner">
      <p class="cookie-banner__text">We use cookies to measure site usage. <a href="/legal/cookies.html">Cookie Policy</a></p>
      <div class="cookie-banner__actions">
        <button type="button" class="cookie-banner__btn cookie-banner__btn--reject">Reject</button>
        <button type="button" class="cookie-banner__btn cookie-banner__btn--accept cta-button">Accept</button>
      </div>
    </div>
  </div>

  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"LocalBusiness","name":"Mother's Day ${escapeHtml(name)} | Celebrate Mother's Day UK","url":"${canonical}","description":"Mother's Day ${escapeHtml(name)}: things to do, gift ideas and experiences for Mum. Book Mother's Day plans, Candlelight and events on Fever.","image":"${DOMAIN}/images/${slug}.png","address":{"@type":"PostalAddress","addressLocality":"${escapeHtml(name)}","addressCountry":"GB"},"areaServed":{"@type":"City","name":"${escapeHtml(name)}"}}
  </script>
  <script src="${assetDepth}js/glide.min.js" defer></script>
  <script src="${assetDepth}js/main.min.js" defer></script>
</body>
</html>
`;
}

/** Separa precio y valoración cuando priceText termina en " X.X" (ej. "From £22.05 4.8" → price + rating). */
function parsePriceAndRating(priceText) {
  if (!priceText || typeof priceText !== 'string') return { price: priceText || '', rating: null };
  const trimmed = priceText.trim();
  const ratingMatch = trimmed.match(/\s+(\d\.\d)\s*$/);
  if (ratingMatch) {
    return {
      price: trimmed.slice(0, -ratingMatch[0].length).trim(),
      rating: ratingMatch[1]
    };
  }
  return { price: trimmed, rating: null };
}

function planCardHtml(pick, opts) {
  const { url, priceText, imgSrc, imgAlt, title, badge, ctaText } = opts;
  const { price, rating } = parsePriceAndRating(priceText);
  const ratingHtml = rating
    ? `<span class="pick-card__rating" aria-label="Rating ${rating} out of 5">★ ${rating}</span>`
    : '';
  return `
    <article class="pick-card">
      <a href="${escapeHtml(url)}" class="pick-card__link" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(pick.name)} — Get tickets on Fever">
        <span class="pick-card__img-wrap">
          <img src="${escapeHtml(imgSrc)}" alt="${imgAlt}" width="400" height="300" loading="lazy" class="pick-card__img">
        </span>
        <div class="pick-card__body">
          <span class="pick-card__badge">${escapeHtml(badge)}</span>
          <h3 class="pick-card__title">${escapeHtml(title || pick.name)}</h3>
          <span class="pick-card__price">${escapeHtml(price)}</span>${ratingHtml ? '\n          ' + ratingHtml : ''}
          <span class="pick-card__cta cta-button cta-button--card">${escapeHtml(ctaText || 'Get Tickets →')}</span>
        </div>
      </a>
    </article>`;
}

function cityMainPage(city, feverPlans) {
  const name = city.name;
  const slug = city.slug;
  const feverUrl = city.feverUrl || `https://feverup.com/en/${slug}/mothers-day`;
  const imgBase = '../images/' + slug;
  const cityUrl = `${DOMAIN}/${slug}/`;

  const { experiences, giftCards } = getCityPlans(feverPlans, slug);
  const plans = experiences.filter((p) => p && p.name && (p.url || feverUrl));
  const picks = plans.length > 0 ? plans.slice(0, 6) : TOP_PICKS_FALLBACK.map((p) => ({ ...p, url: p.url || feverUrl }));
  const sectionTitle = plans.length > 0 ? "Mother's Day plans in " + name : "Top picks for Mother's Day";

  const topPicksHtml = picks.map(
    (pick, i) => {
      const url = pick.url || feverUrl;
      const priceText = pick.priceText || 'Get tickets';
      const imgSrc = (pick.image && pick.image.startsWith('http')) ? pick.image : (imgBase + '.png');
      const imgAlt = escapeHtml(pick.name) + ' — Mother\'s Day experience in ' + escapeHtml(name);
      return planCardHtml(pick, {
        url,
        priceText,
        imgSrc,
        imgAlt,
        title: pick.name,
        badge: '#' + (i + 1) + ' ' + (plans.length > 0 ? 'PLAN' : 'TOP PICK'),
        ctaText: 'Get Tickets →'
      });
    }
  ).join('\n');

  const mainContent = `
    <div class="container container--breadcrumb">
      <nav class="breadcrumb breadcrumb--hero" aria-label="Breadcrumb">
        <a href="/">UK</a> <span class="breadcrumb__sep" aria-hidden="true">›</span> <span class="breadcrumb__current">${escapeHtml(name)}</span>
      </nav>
    </div>
    <section class="hero hero--city hero--${slug}" aria-labelledby="hero-heading">
      <div class="hero__background">
        <img src="${imgBase}.png" alt="Mother's Day ${escapeHtml(name)} — best gifts and experiences for Mum" width="1920" height="1080" loading="eager" fetchpriority="high" class="hero__img">
      </div>
      <div class="hero__overlay" aria-hidden="true"></div>
      <div class="hero__content">
        <span class="hero__badge" aria-hidden="true">Mother's Day 2026</span>
        <h1 id="hero-heading" class="hero__title">Mother's Day in ${escapeHtml(name)}</h1>
        <p class="hero__subtitle">Discover the best Mother's Day ideas, gifts and experiences in ${escapeHtml(name)}</p>
        <a href="${feverUrl}" class="hero__cta cta-button" target="_blank" rel="noopener noreferrer" aria-label="See Mother's Day experiences on Fever">See Mother's Day experiences</a>
      </div>
    </section>

    <section class="section section--picks" aria-labelledby="picks-heading">
      <div class="container">
        <h2 id="picks-heading" class="section__title">${escapeHtml(sectionTitle)}</h2>
        <p class="section__intro">Most loved experiences for Mother's Day in ${escapeHtml(name)}. Book directly on Fever.</p>
        <div class="picks-grid picks-grid--stagger">
          ${topPicksHtml}
        </div>
      </div>
    </section>

    <section class="section section--gift-cards" aria-labelledby="gift-cards-heading">
      <div class="container">
        <div class="gift-cards-header">
          <h2 id="gift-cards-heading" class="section__title section__title--inline">Gift Cards</h2>
          <a href="${escapeHtml(feverUrl)}" class="gift-cards-see-all" target="_blank" rel="noopener noreferrer">See all</a>
        </div>
        <div class="gift-cards-scroll" role="list">
          ${(giftCards.length > 0 ? giftCards : GIFT_CARDS_FALLBACK.map((c) => ({ name: c.name, priceText: c.priceText, url: null, image: null }))).map((card) => {
            const cardUrl = card.url || feverUrl;
            const cardImg = (card.image && card.image.startsWith('http')) ? card.image : (imgBase + '.png');
            return `
          <article class="gift-card" role="listitem">
            <a href="${escapeHtml(cardUrl)}" class="gift-card__link" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(card.name)} — ${escapeHtml(card.priceText || '')} on Fever">
              <span class="gift-card__img-wrap">
                <img src="${escapeHtml(cardImg)}" alt="${escapeHtml(card.name)} — Mother's Day gift card ${escapeHtml(name)}" width="280" height="180" loading="lazy" class="gift-card__img">
              </span>
              <span class="gift-card__title">${escapeHtml(card.name)}</span>
              <span class="gift-card__price">${escapeHtml(card.priceText || '')}</span>
            </a>
          </article>`;
          }).join('\n          ')}
        </div>
      </div>
    </section>

    <section class="section section--why" aria-labelledby="why-heading">
      <div class="container">
        <h2 id="why-heading" class="section__title">Why ${escapeHtml(name)} is perfect for Mother's Day</h2>
        <div class="why-grid">
          <div class="why-block">
            <h3 class="why-block__title">Iconic experiences</h3>
            <p class="why-block__text">From afternoon tea to Candlelight concerts, ${escapeHtml(name)} offers memorable Mother's Day experiences. Find gift ideas and things to do for Mum.</p>
          </div>
          <div class="why-block">
            <h3 class="why-block__title">Afternoon tea &amp; dining</h3>
            <p class="why-block__text">Treat Mum to afternoon tea or a special meal. Restaurants and experiences for Mother's Day in ${escapeHtml(name)} — book ahead on Fever.</p>
          </div>
          <div class="why-block">
            <h3 class="why-block__title">Candlelight &amp; events</h3>
            <p class="why-block__text">Candlelight concerts and Mother's Day events in ${escapeHtml(name)}. Experience gifts she'll remember.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--ideas" aria-labelledby="ideas-heading">
      <div class="container">
        <h2 id="ideas-heading" class="section__title">Mother's Day ideas in ${escapeHtml(name)}</h2>
        <p class="section__intro">Explore the best options to celebrate Mother's Day</p>
        <div class="ideas-grid ideas-grid--stagger">
          <a href="/${slug}/ideas/" class="idea-card">
            <span class="idea-card__title">Mother's Day Gifts</span>
            <span class="idea-card__desc">Find the best Mother's Day gifts in ${escapeHtml(name)}</span>
          </a>
          <a href="/${slug}/experiences/" class="idea-card">
            <span class="idea-card__title">Mother's Day Experiences</span>
            <span class="idea-card__desc">Experiences and gift ideas for Mum in ${escapeHtml(name)}</span>
          </a>
          <a href="/${slug}/events/" class="idea-card">
            <span class="idea-card__title">Mother's Day Events</span>
            <span class="idea-card__desc">Events for Mother's Day in ${escapeHtml(name)}</span>
          </a>
          <a href="/${slug}/candlelight/" class="idea-card">
            <span class="idea-card__title">Candlelight Mother's Day</span>
            <span class="idea-card__desc">Candlelight concerts for Mother's Day in ${escapeHtml(name)}</span>
          </a>
        </div>
      </div>
    </section>

    <section class="section section--cta-fever">
      <div class="container">
        <p class="section__intro">See all Mother's Day experiences, gift ideas and events in ${escapeHtml(name)} on Fever.</p>
        <p><a href="${feverUrl}" class="cta-button" target="_blank" rel="noopener noreferrer" aria-label="See all Mother's Day experiences on Fever">See all on Fever &rarr;</a></p>
      </div>
    </section>

    <section class="section section--seo" aria-labelledby="seo-city-heading">
      <div class="container">
        <h2 id="seo-city-heading" class="section__title section__title--seo">Mother's Day ${escapeHtml(name)}: things to do, gifts and experiences</h2>
        <div class="seo-content">
          <p>Looking for <strong>Mother's Day ideas in ${escapeHtml(name)}</strong> or <strong>things to do for Mother's Day</strong>? We've got <strong>Mother's Day plans</strong>, <strong>experience gifts</strong> and <strong>Mother's Day events</strong> in ${escapeHtml(name)} — from afternoon tea to <a href="/${slug}/candlelight/">Candlelight Mother's Day ${escapeHtml(name)}</a>, <a href="/${slug}/experiences/">Mother's Day experiences in ${escapeHtml(name)}</a> and <a href="/${slug}/ideas/">Mother's Day gift ideas ${escapeHtml(name)}</a>. <a href="/${slug}/events/">Mother's Day events ${escapeHtml(name)}</a> are bookable on Fever. <a href="/">Mother's Day UK</a> — pick your city and book for Mum.</p>
        </div>
      </div>
    </section>`;

  const breadcrumbList = [
    { name: 'UK', item: DOMAIN + '/' },
    { name: name, item: cityUrl }
  ];
  return layout({
    pageTitle: `Mother's Day ${name} 2026 | Things to Do, Gifts & Experiences`,
    metaDescription: `Mother's Day ${name}: gift ideas, things to do and experiences for Mum. Book Mother's Day plans, Candlelight & events. See Mother's Day ${name} on Fever.`,
    keywords: `mothers day ${slug}, mothers day ${name}, things to do mothers day ${slug}, mothers day plans ${slug}, mothers day gifts ${slug}`,
    canonical: cityUrl,
    mainContent,
    assetDepth: '../',
    city,
    feverUrl,
    stickyCtaUrl: feverUrl,
    stickyCtaText: 'See on Fever',
    breadcrumbList
  });
}

const FEATURED_PLANS_MAX = 6;

function citySubPage(city, type, feverPlans) {
  const name = city.name;
  const slug = city.slug;
  const feverUrl = city.feverUrl || `https://feverup.com/en/${slug}/mothers-day`;
  const feverCandlelightUrl = `https://feverup.com/en/${slug}/candlelight-${slug}`;
  const imgBase = '../../images/' + slug;
  const assetDepth = '../../';
  const { experiences, giftCards, candlelightExperiences } = getCityPlans(feverPlans, slug);
  const classified = classifyPlans(experiences, giftCards, candlelightExperiences);

  let plansForFeatured;
  if (type === 'candlelight' && candlelightExperiences.length > 0) {
    plansForFeatured = candlelightExperiences;
  } else if (type === 'ideas') {
    plansForFeatured = classified.ideas.length > 0
      ? classified.ideas
      : [...(giftCards || []), ...(experiences || []).slice(0, FEATURED_PLANS_MAX)];
  } else if (type === 'experiences') {
    plansForFeatured = classified.experiences.length > 0
      ? classified.experiences
      : (experiences || []).slice(0, FEATURED_PLANS_MAX);
  } else if (type === 'events') {
    plansForFeatured = classified.events.length > 0
      ? classified.events
      : (experiences || []).slice(0, FEATURED_PLANS_MAX);
  } else {
    plansForFeatured = experiences || [];
  }

  const featuredPlans = plansForFeatured.filter((p) => p && p.name && (p.url || feverUrl)).slice(0, FEATURED_PLANS_MAX);
  const pageFeverUrl = type === 'candlelight' ? feverCandlelightUrl : feverUrl;
  const sectionTitles = {
    candlelight: 'Candlelight concerts in ' + name,
    ideas: "Mother's Day ideas in " + name,
    experiences: "Mother's Day experiences in " + name,
    events: "Mother's Day events in " + name
  };
  const featuredSectionTitle = sectionTitles[type] || "Mother's Day experiences in " + name;
  const featuredSectionIntro = type === 'candlelight'
    ? 'Candlelight concerts in ' + name + '. Book on Fever.'
    : "From Fever's Mother's Day page — book directly below.";
  const emptyStateIntro = type === 'candlelight'
    ? 'No Candlelight plans in ' + name + ' right now. Check Fever for the latest concerts and experiences.'
    : "No plans in this category right now. Check back soon or see what's on Fever.";
  const featuredHtml = featuredPlans.length > 0
    ? `
    <section class="section section--picks" aria-labelledby="featured-heading">
      <div class="container">
        <h2 id="featured-heading" class="section__title">Plans to book</h2>
        <p class="section__intro">${escapeHtml(featuredSectionIntro)}</p>
        <div class="picks-grid picks-grid--stagger">
          ${featuredPlans.map((pick, i) => {
            const url = pick.url || pageFeverUrl;
            const priceText = pick.priceText || 'Get tickets';
            const imgSrc = (pick.image && pick.image.startsWith('http')) ? pick.image : (imgBase + '.png');
            const imgAlt = escapeHtml(pick.name) + ' — ' + (type === 'candlelight' ? 'Candlelight ' : "Mother's Day ") + escapeHtml(name);
            return planCardHtml(pick, {
              url,
              priceText,
              imgSrc,
              imgAlt,
              title: pick.name,
              badge: 'PLAN',
              ctaText: 'Get Tickets →'
            });
          }).join('\n          ')}
        </div>
        <p><a href="${escapeHtml(pageFeverUrl)}" class="cta-button" target="_blank" rel="noopener noreferrer">See all on Fever &rarr;</a></p>
      </div>
    </section>`
    : `
    <section class="section section--picks section--empty-state" aria-labelledby="featured-heading">
      <div class="container">
        <h2 id="featured-heading" class="section__title">Plans to book</h2>
        <p class="section__intro">${escapeHtml(emptyStateIntro)}</p>
        <p><a href="${escapeHtml(pageFeverUrl)}" class="cta-button" target="_blank" rel="noopener noreferrer">${type === 'candlelight' ? 'See Candlelight on Fever' : "See Mother's Day plans on Fever"}</a></p>
      </div>
    </section>`;
  const configs = {
    ideas: {
      path: 'ideas',
      title: `Mother's Day Ideas ${name} 2026 | Gift Ideas for Mum`,
      description: `Mother's Day ideas ${name}: gift ideas and inspiration for Mum. Best Mother's Day gifts and experiences. Book on Fever.`,
      keywords: `mothers day ideas ${slug}, gift ideas mothers day ${slug}, mothers day gifts ${slug}`,
      h1: `Mother's Day ideas in ${name}`,
      intro: `Find the best Mother's Day gift ideas and inspiration in ${name}. Experiences, dinners and unique plans for Mum. Book Mother's Day gifts on Fever.`
    },
    experiences: {
      path: 'experiences',
      title: `Mother's Day Experiences ${name} 2026 | Experience Gifts`,
      description: `Mother's Day experiences ${name}: experience gifts and things to do for Mum. Book Mother's Day experience gifts on Fever.`,
      keywords: `mothers day experiences ${slug}, experience gifts mothers day ${slug}, things to do mothers day ${slug}`,
      h1: `Mother's Day experiences in ${name}`,
      intro: `Discover Mother's Day experience gifts in ${name}. Dinners, workshops and unforgettable plans for Mum. Book Mother's Day experiences on Fever.`
    },
    events: {
      path: 'events',
      title: `Mother's Day Events ${name} 2026 | Events for Mum`,
      description: `Mother's Day events ${name}: things to do and events for Mother's Day. Concerts, dinners and special events. Book on Fever.`,
      keywords: `mothers day events ${slug}, events for mothers day ${slug}, mothers day ${slug} events`,
      h1: `Mother's Day events in ${name}`,
      intro: `Find Mother's Day events in ${name}. Concerts, dinners and special events for Mum. Book Mother's Day events on Fever.`
    },
    candlelight: {
      path: 'candlelight',
      title: `Mother's Day Candlelight ${name} 2026 | Candlelight Concerts`,
      description: `Mother's Day Candlelight ${name}: Candlelight concerts and experience gifts for Mum. Book Candlelight Mother's Day on Fever.`,
      keywords: `mothers day candlelight ${slug}, candlelight mothers day ${slug}, candlelight concert ${slug}`,
      h1: `Mother's Day Candlelight in ${name}`,
      intro: `Candlelight Mother's Day experiences in ${name}. Intimate concerts and unique gifts for Mum. Book Candlelight Mother's Day on Fever.`
    }
  };
  const c = configs[type];
  if (!c) return '';
  const canonical = `${DOMAIN}/${slug}/${c.path}/`;
  const mainContent = `
    <section class="section section--subpage">
      <div class="container">
        <nav class="breadcrumb breadcrumb--subpage" aria-label="Breadcrumb">
          <a href="/">UK</a><span class="breadcrumb__sep" aria-hidden="true">›</span><a href="/${slug}/">${escapeHtml(name)}</a><span class="breadcrumb__sep" aria-hidden="true">›</span><span class="breadcrumb__current">${escapeHtml(c.h1)}</span>
        </nav>
        <h1 class="section__title">${escapeHtml(c.h1)}</h1>
        <p class="section__intro">${escapeHtml(c.intro)}</p>
        <p><a href="${escapeHtml(pageFeverUrl)}" class="cta-button" target="_blank" rel="noopener noreferrer">${type === 'candlelight' ? 'See Candlelight concerts in ' + escapeHtml(name) + ' on Fever' : 'See Mother\'s Day in ' + escapeHtml(name) + ' on Fever'}</a></p>
        <p><a href="/${slug}/" class="link--back">Back to Mother's Day ${escapeHtml(name)}</a></p>
      </div>
    </section>${featuredHtml}
    <section class="section section--seo" aria-labelledby="seo-subpage-heading">
      <div class="container">
        <h2 id="seo-subpage-heading" class="section__title section__title--seo">${escapeHtml(c.h1)} — book on Fever</h2>
        <div class="seo-content">
          <p>Looking for <strong>${escapeHtml(c.h1)}</strong>? Book <strong>Mother's Day plans</strong> and <strong>experience gifts</strong> in ${escapeHtml(name)} on Fever. See also <a href="/${slug}/">Mother's Day ${escapeHtml(name)}</a>, <a href="/${slug}/ideas/">Mother's Day ideas ${escapeHtml(name)}</a>, <a href="/${slug}/experiences/">Mother's Day experiences ${escapeHtml(name)}</a>, <a href="/${slug}/events/">Mother's Day events ${escapeHtml(name)}</a> and <a href="/${slug}/candlelight/">Candlelight Mother's Day ${escapeHtml(name)}</a>. <a href="/">Mother's Day UK</a> — pick your city and book for Mum.</p>
        </div>
      </div>
    </section>`;
  const breadcrumbList = [
    { name: 'UK', item: DOMAIN + '/' },
    { name: name, item: DOMAIN + '/' + slug + '/' },
    { name: c.h1, item: canonical }
  ];
  return layout({
    pageTitle: c.title,
    metaDescription: c.description,
    keywords: c.keywords,
    canonical,
    mainContent,
    assetDepth,
    city,
    feverUrl: pageFeverUrl,
    stickyCtaUrl: pageFeverUrl,
    stickyCtaText: type === 'candlelight' ? 'See Candlelight on Fever' : 'See on Fever',
    breadcrumbList
  });
}

/** Generate sitemap.xml from campaign domain and cities (called after pages are generated). */
function writeSitemap(domain, cities) {
  const base = domain.replace(/\/$/, '');
  const lastmod = new Date().toISOString().slice(0, 10);
  const subTypes = ['ideas', 'experiences', 'events', 'candlelight'];

  const urls = [
    { loc: base + '/', changefreq: 'weekly', priority: '1.0' },
    { loc: base + '/legal/cookies.html', changefreq: 'monthly', priority: '0.3' }
  ];
  for (const city of cities) {
    urls.push({ loc: base + '/' + city.slug + '/', changefreq: 'weekly', priority: '0.9' });
    for (const type of subTypes) {
      urls.push({ loc: base + '/' + city.slug + '/' + type + '/', changefreq: 'weekly', priority: '0.8' });
    }
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n' +
    urls.map((u) => '  <url>\n    <loc>' + u.loc + '</loc>\n    <lastmod>' + lastmod + '</lastmod>\n    <changefreq>' + u.changefreq + '</changefreq>\n    <priority>' + u.priority + '</priority>\n  </url>').join('\n') +
    '\n</urlset>\n';

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('Generated: sitemap.xml');
}

function main() {
  const campaignId = getCampaignId();
  const campaignConfig = loadCampaignConfig(campaignId);

  FEVER_PLANS_PATH = path.isAbsolute(campaignConfig.outputDataFile)
    ? campaignConfig.outputDataFile
    : path.join(ROOT, campaignConfig.outputDataFile);
  DOMAIN = campaignConfig.domain || DOMAIN;

  let cities = campaignConfig.cities || [];
  if (cities.length === 0 && fs.existsSync(DATA_PATH)) {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    cities = data.cities || [];
  }
  const feverPathTemplate = campaignConfig.feverPathTemplate || 'https://feverup.com/en/{city}/mothers-day';
  cities = cities.map((c) => ({
    ...c,
    feverUrl: c.feverUrl || (feverPathTemplate.replace('{city}', c.slug))
  }));

  let count = 0;
  const feverPlans = loadFeverPlans();
  cities.forEach(function (city) {
    const dir = path.join(ROOT, city.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'index.html'), cityMainPage(city, feverPlans), 'utf8');
    console.log('Generated:', city.slug + '/index.html');
    count++;

    ['ideas', 'experiences', 'events', 'candlelight'].forEach(function (type) {
      const subDir = path.join(dir, type);
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      const html = citySubPage(city, type, feverPlans);
      fs.writeFileSync(path.join(subDir, 'index.html'), html, 'utf8');
      console.log('Generated:', city.slug + '/' + type + '/index.html');
      count++;
    });
  });

  writeSitemap(DOMAIN, cities);
  console.log('Done. Generated', count, 'pages.');
}

main();
