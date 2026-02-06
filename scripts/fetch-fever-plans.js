/**
 * Fetch Mother's Day plans from Fever (wrapper around fetch-fever-category.js).
 * Source: https://feverup.com/en/{city}/mothers-day
 * Saves data/fever-plans-uk.json with experiences + giftCards.
 * Requires: npm install playwright && npx playwright install chromium
 * Run: node scripts/fetch-fever-plans.js
 */
const { runFetch, loadCampaignConfig } = require('./fetch-fever-category.js');

const config = loadCampaignConfig('mothers-day');
runFetch(config).catch((e) => {
  console.error(e);
  process.exit(1);
});
