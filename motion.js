/* ==========================================================================
   AIChecked.nl — premium motion layer
   Adds: Lenis smooth scroll + reveal-on-scroll. Purely additive — does not
   touch existing markup, text, colors or layout. Respects prefers-reduced-
   motion and disables Lenis on touch devices so mobile scroll stays native.
   ========================================================================== */
(function(){
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  /* ---------------------------------------------------------------------
     1. Premium smooth scroll (desktop/laptop, fine pointer, motion allowed)
     --------------------------------------------------------------------- */
  function initLenis(){
    if(reduceMotion || isCoarsePointer) return;
    if(typeof window.Lenis !== 'function') return;
    if(window.__aicLenis) return; // never double-init

    var lenis = new window.Lenis({
      duration: 1.05,
      easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4
    });
    window.__aicLenis = lenis;

    var rafId;
    function raf(time){
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // No custom anchor-click handling: this site has no in-page scroll
    // anchors to enhance, so native hash-link behaviour (and the existing
    // file:// hash router in the page scripts) is left completely intact.
  }

  /* ---------------------------------------------------------------------
     2. Reveal-on-scroll: soft opacity + translateY for below-the-fold
        headings, eyebrows and card-style blocks. Hero/nav/footer/cookie
        banner and the embedded product-mockup are always excluded.
     --------------------------------------------------------------------- */
  function initReveal(){
    if(reduceMotion) return;
    if(!('IntersectionObserver' in window)) return;

    var EXCLUDE_SELECTOR = '#main-nav, .mobile-menu, #cookie-banner, footer, .dashboard-main, [class*="hero"]';
    var CANDIDATE_SELECTOR = '[class$="-card"], .logo-slider-card, .eyebrow, h2';

    var all = Array.prototype.slice.call(document.querySelectorAll(CANDIDATE_SELECTOR));

    // Drop anything inside an excluded region.
    var candidates = all.filter(function(el){ return !el.closest(EXCLUDE_SELECTOR); });

    // Drop nested candidates so a card and its own heading don't both
    // animate independently — only the outermost block reveals.
    var eligible = candidates.filter(function(el){
      return !candidates.some(function(other){ return other !== el && other.contains(el); });
    });

    if(!eligible.length) return;

    // Stagger siblings that share a parent, capped so long lists don't
    // cascade forever.
    var parentCounts = new Map();
    eligible.forEach(function(el){
      var parent = el.parentElement;
      var idx = parentCounts.get(parent) || 0;
      parentCounts.set(parent, idx + 1);
      el.style.transitionDelay = (Math.min(idx, 5) * 70) + 'ms';
      el.classList.add('aic-reveal');
    });

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('aic-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    var viewportH = window.innerHeight;
    eligible.forEach(function(el){
      var rect = el.getBoundingClientRect();
      var alreadyVisible = rect.top < viewportH * 0.92 && rect.bottom > 0;
      if(alreadyVisible){
        // Protect perceived load speed / LCP: content already in view on
        // load stays fully visible, never fades in.
        el.classList.remove('aic-reveal');
        el.style.transitionDelay = '';
        return;
      }
      observer.observe(el);
    });

    // Accessibility safety net: if keyboard focus lands on a not-yet-
    // revealed element (e.g. via Tab before it scrolls into view), reveal
    // it immediately instead of leaving a focused element invisible.
    document.addEventListener('focusin', function(e){
      var el = e.target.closest ? e.target.closest('.aic-reveal:not(.aic-in)') : null;
      if(el){
        el.classList.add('aic-in');
        observer.unobserve(el);
      }
    });
  }

  function init(){
    initReveal();
    initLenis();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
