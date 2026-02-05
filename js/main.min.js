/**
 * Mother's Day UK - Main JS
 * Uses Glide.js for carousels (self-hosted glide.min.js loaded with defer)
 */
(function () {
  'use strict';

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
    initNavigation();
    initHeaderScroll();
    initGlides();
    initVideoCarousel();
  });
})();
