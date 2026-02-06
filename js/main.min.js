/**
 * Mother's Day UK - Main JS
 * Uses Glide.js for carousels; cookie consent (GDPR/CCPA) and GA4 only after accept.
 */
(function () {
  'use strict';

  var CONSENT_COOKIE = 'cookie_consent';
  var CONSENT_MAX_AGE = 365 * 24 * 60 * 60;
  var GA_MEASUREMENT_ID = 'G-L9EXZB0W73';

  function getConsent() {
    if (typeof document === 'undefined' || !document.cookie) return null;
    var match = document.cookie.match(new RegExp('(?:^|; )' + CONSENT_COOKIE + '=([^;]*)'));
    var value = match ? decodeURIComponent(match[1]) : null;
    if (value === 'accept' || value === 'reject') return value;
    return null;
  }

  function setConsent(value) {
    if (typeof document === 'undefined') return;
    var secure = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') ? ';Secure' : '';
    document.cookie = CONSENT_COOKIE + '=' + encodeURIComponent(value) + ';path=/;max-age=' + CONSENT_MAX_AGE + ';SameSite=Lax' + secure;
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: value }));
    }
  }

  function loadGA4() {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
  }

  function initCookieBanner() {
    var banner = document.getElementById('cookie-consent-banner');
    if (!banner) return;
    var consent = getConsent();
    if (consent === null) {
      banner.classList.remove('cookie-banner--hidden');
    } else if (consent === 'accept') {
      loadGA4();
    }
    var acceptBtn = banner.querySelector('.cookie-banner__btn--accept');
    var rejectBtn = banner.querySelector('.cookie-banner__btn--reject');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        setConsent('accept');
        banner.classList.add('cookie-banner--hidden');
        loadGA4();
      });
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        setConsent('reject');
        banner.classList.add('cookie-banner--hidden');
      });
    }
  }

  function initNavigation() {
    var nav = document.querySelector('.site-header__nav');
    if (!nav) return;
    var links = nav.querySelectorAll('a');
    links.forEach(function (link) {
      link.setAttribute('rel', link.getAttribute('href') && link.getAttribute('href').indexOf('http') === 0 ? 'noopener noreferrer' : '');
    });
  }

  function createGlide(selector, options) {
    if (typeof window.Glide === 'undefined') return;
    var el = document.querySelector(selector);
    if (!el) return;
    var defaultOptions = {
      type: 'carousel',
      animationDuration: 400,
      hoverpause: true,
      perTouch: false,
      swipeThreshold: 40,
      dragThreshold: 60,
      breakpoints: {
        1023: { perView: 2, gap: 20 },
        639: { perView: 1, gap: 20 }
      },
      pagination: {
        clickable: false,
        renderBullet: function (index, className) {
          return '<span class="' + className + '" role="presentation"></span>';
        }
      }
    };
    var merged = Object.assign({}, defaultOptions, options || {});
    new window.Glide(selector, merged).mount();
  }

  function initGlides() {
    var carousels = document.querySelectorAll('.glide');
    if (carousels.length === 0) return;
    if (typeof window.Glide === 'undefined') return;
    carousels.forEach(function (el, i) {
      var id = el.id || ('glide-' + i);
      if (!el.id) el.id = id;
      createGlide('#' + id, { perView: 3, gap: 30 });
    });
  }

  function initVideoCarousel() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initGlides, { timeout: 2000 });
    } else {
      setTimeout(initGlides, 100);
    }
  }

  function initHeaderScroll() {
    var header = document.getElementById('site-header');
    if (!header) return;
    var threshold = 60;
    function updateHeader() {
      if (window.scrollY > threshold) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCookieBanner();
    initNavigation();
    initHeaderScroll();
    initGlides();
    initVideoCarousel();
  });
})();
