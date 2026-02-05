/**
 * Generate static HTML city pages for Mother's Day UK.
 * Domain: celebratemothersday.co.uk
 * Cities: London, Manchester, Birmingham.
 * Per city: main (/city/), ideas, experiences, events, candlelight.
 * Run: node scripts/generate-city-pages.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'uk-cities.json');
const DOMAIN = 'https://celebratemothersday.co.uk';

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(opts) {
  const { pageTitle, metaDescription, keywords, canonical, h1Text, mainContent, assetDepth, city, feverUrl } = opts;
  const name = city.name;
  const slug = city.slug;
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <link rel="canonical" href="${canonical}">
  <link rel="preload" href="${assetDepth}css/bundle.min.css" as="style">
  <link rel="stylesheet" href="${assetDepth}css/bundle.min.css">
  <link rel="icon" href="${assetDepth}images/favicon.ico" sizes="any">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${DOMAIN}/images/${slug}-og.jpg">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-header__logo">Celebrate Mother's Day</a>
      <nav class="site-header__nav">
        <a href="/">Home</a>
        <a href="/legal/cookies.html">Cookie Policy</a>
      </nav>
    </div>
  </header>

  <main>
    ${mainContent}
  </main>

  <footer class="site-footer">
    <div class="container">
      <p><a href="/">View all UK cities</a> &middot; <a href="/${slug}/">${escapeHtml(name)}</a></p>
      <p>Celebrate Mother's Day is operated by Fever Up Entertainment. &copy; 2026.</p>
      <p><a href="/legal/cookies.html">Cookie Policy</a></p>
    </div>
  </footer>

  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"LocalBusiness","name":"${escapeHtml(pageTitle)}","url":"${canonical}","description":"${escapeHtml(metaDescription)}","address":{"@type":"PostalAddress","addressLocality":"${escapeHtml(name)}","addressCountry":"GB"}}
  </script>
  <script src="${assetDepth}js/glide.min.js" defer></script>
  <script src="${assetDepth}js/main.min.js" defer></script>
</body>
</html>
`;
}

function cityMainPage(city) {
  const name = city.name;
  const slug = city.slug;
  const feverUrl = city.feverUrl || `https://feverup.com/en/${slug}/mothers-day`;
  const heroImage = '../images/' + slug + '.png';
  const cityUrl = `${DOMAIN}/${slug}/`;
  const mainContent = `
    <section class="hero">
      <div class="hero__background">
        <img src="${heroImage}" alt="Mother's Day ${escapeHtml(name)} — best gifts and experiences for Mum" width="1920" height="1080" loading="eager" class="hero__img">
      </div>
      <div class="hero__overlay" aria-hidden="true"></div>
      <div class="hero__content">
        <h1 class="hero__title">Mother's Day in ${escapeHtml(name)}</h1>
        <p class="hero__subtitle">Things to do, plans &amp; experiences for Mum</p>
      </div>
    </section>

    <section class="section section--animate">
      <div class="container">
        <h2 class="section__title">Mother's Day plans in ${escapeHtml(name)}</h2>
        <p class="section__intro">Discover the best Mother's Day experiences, dinners and gift ideas in ${escapeHtml(name)}. Book now on Fever.</p>
        <p><a href="${feverUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">See Mother's Day in ${escapeHtml(name)} on Fever</a></p>
        <nav class="city-nav" aria-label="Mother's Day ${escapeHtml(name)} pages">
          <a href="/${slug}/ideas/">Mother's Day ideas ${escapeHtml(name)}</a> &middot;
          <a href="/${slug}/experiences/">Mother's Day experiences ${escapeHtml(name)}</a> &middot;
          <a href="/${slug}/events/">Mother's Day events ${escapeHtml(name)}</a> &middot;
          <a href="/${slug}/candlelight/">Mother's Day Candlelight ${escapeHtml(name)}</a>
        </nav>
      </div>
    </section>`;
  return layout({
    pageTitle: `Mother's Day ${name} 2026 | Things to Do & Plans`,
    metaDescription: `Mother's day ${name}: things to do, plans and experiences for Mum. Best gifts and ideas. Book on Fever.`,
    keywords: `mothers day ${slug}, things to do mothers day ${slug}, mothers day plans ${slug}`,
    canonical: cityUrl,
    h1Text: `Mother's Day in ${name}`,
    mainContent,
    assetDepth: '../',
    city,
    feverUrl
  });
}

function citySubPage(city, type) {
  const name = city.name;
  const slug = city.slug;
  const feverUrl = city.feverUrl || `https://feverup.com/en/${slug}/mothers-day`;
  const assetDepth = '../../';
  const configs = {
    ideas: {
      path: 'ideas',
      title: `Mother's Day Ideas ${name} 2026 | Gift Ideas`,
      description: `Mother's day ideas ${name}: gift ideas and inspiration for Mum. Best experiences and plans. Book on Fever.`,
      keywords: `mothers day ideas ${slug}, gift ideas mothers day ${slug}`,
      h1: `Mother's Day ideas in ${name}`,
      intro: `Find the best Mother's Day gift ideas and inspiration in ${name}. Experiences, dinners and unique plans for Mum.`
    },
    experiences: {
      path: 'experiences',
      title: `Mother's Day Experiences ${name} 2026 | Experience Gifts`,
      description: `Mother's day experiences ${name}: experience gifts and unique plans for Mum. Book on Fever.`,
      keywords: `mothers day experiences ${slug}, experience gifts mothers day ${slug}`,
      h1: `Mother's Day experiences in ${name}`,
      intro: `Discover Mother's Day experience gifts in ${name}. Dinners, workshops and unforgettable plans for Mum.`
    },
    events: {
      path: 'events',
      title: `Mother's Day Events ${name} 2026 | Events for Mum`,
      description: `Mother's day events ${name}: events for mothers day. Best events and plans. Book on Fever.`,
      keywords: `mothers day events ${slug}, events for mothers day ${slug}`,
      h1: `Mother's Day events in ${name}`,
      intro: `Find Mother's Day events in ${name}. Concerts, dinners and special events for Mum.`
    },
    candlelight: {
      path: 'candlelight',
      title: `Mother's Day Candlelight ${name} 2026`,
      description: `Mother's day Candlelight ${name}: candlelight concerts and experiences for Mum. Book on Fever.`,
      keywords: `mothers day candlelight ${slug}, candlelight mothers day ${slug}`,
      h1: `Mother's Day Candlelight in ${name}`,
      intro: `Candlelight Mother's Day experiences in ${name}. Intimate concerts and unique gifts for Mum.`
    }
  };
  const c = configs[type];
  if (!c) return '';
  const canonical = `${DOMAIN}/${slug}/${c.path}/`;
  const mainContent = `
    <section class="section section--animate">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">UK</a> &rarr; <a href="/${slug}/">${escapeHtml(name)}</a> &rarr; ${escapeHtml(c.h1)}
        </nav>
        <h1 class="section__title">${escapeHtml(c.h1)}</h1>
        <p class="section__intro">${escapeHtml(c.intro)}</p>
        <p><a href="${feverUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">See Mother's Day in ${escapeHtml(name)} on Fever</a></p>
        <p><a href="/${slug}/">Back to Mother's Day ${escapeHtml(name)}</a></p>
      </div>
    </section>`;
  return layout({
    pageTitle: c.title,
    metaDescription: c.description,
    keywords: c.keywords,
    canonical,
    h1Text: c.h1,
    mainContent,
    assetDepth,
    city,
    feverUrl
  });
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const cities = data.cities || [];
  const root = path.join(__dirname, '..');
  let count = 0;
  cities.forEach(function (city) {
    const dir = path.join(root, city.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Main city page: /city/
    fs.writeFileSync(path.join(dir, 'index.html'), cityMainPage(city), 'utf8');
    console.log('Generated:', city.slug + '/index.html');
    count++;

    // Subpages: ideas, experiences, events, candlelight
    ['ideas', 'experiences', 'events', 'candlelight'].forEach(function (type) {
      const subDir = path.join(dir, type);
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      const html = citySubPage(city, type);
      fs.writeFileSync(path.join(subDir, 'index.html'), html, 'utf8');
      console.log('Generated:', city.slug + '/' + type + '/index.html');
      count++;
    });
  });
  console.log('Done. Generated', count, 'pages.');
}

main();
