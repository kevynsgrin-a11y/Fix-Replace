/* =============================================================================
   RepairOrReplace — site chrome behaviour

   The header, drawer and footer markup is STATIC on every page (stamped by
   tools/render-chrome.mjs from tools/site-chrome.mjs). This file only enhances
   what is already in the document:

     1. the mobile navigation drawer (≤999px) — focus trap, Esc, scroll lock
     2. the theme toggle, including its pressed state and the theme-color meta
     3. the header CTA, hidden while the calculator it points at is on screen
     4. scroll-reveal — and, critically, the class that *enables* reveal, so a
        script failure can never leave content stranded at opacity:0
   ========================================================================== */
(function () {
  'use strict';

  var SUN =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></svg>';
  var MOON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/></svg>';

  var FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------------------------------------------------------------- theme -- */

  function currentTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* A media-qualified <meta name="theme-color"> follows the OS, not our
     data-theme override, so the browser chrome would disagree with the page
     after a manual toggle. Once the user picks a theme we collapse to a single
     unconditional tag carrying the matching canvas colour. */
  function syncThemeColor(theme) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    if (!metas.length) return;
    var color = theme === 'dark' ? '#080c14' : '#f6f7f9';
    for (var i = 1; i < metas.length; i++) metas[i].remove();
    metas[0].removeAttribute('media');
    metas[0].setAttribute('content', color);
  }

  function renderToggles() {
    var dark = currentTheme() === 'dark';
    var label = dark ? 'Switch to light theme' : 'Switch to dark theme';
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < toggles.length; i++) {
      var btn = toggles[i];
      btn.setAttribute('aria-pressed', String(dark));
      var text = btn.querySelector('[data-theme-label]');
      if (text) {
        text.textContent = label;
        btn.removeAttribute('aria-label');
      } else {
        btn.setAttribute('aria-label', label);
        btn.innerHTML = dark ? SUN : MOON;
      }
    }
  }

  function wireTheme() {
    syncThemeColor(currentTheme());
    renderToggles();
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('ror-theme', next);
      } catch (err) {}
      syncThemeColor(next);
      renderToggles();
    });
  }

  /* --------------------------------------------------------------- drawer -- */

  function wireDrawer() {
    var drawer = document.querySelector('[data-drawer]');
    var scrim = document.querySelector('[data-drawer-scrim]');
    var opener = document.querySelector('[data-nav-toggle]');
    if (!drawer || !opener) return;
    var main = document.getElementById('main');
    var open = false;

    function setOpen(next) {
      if (next === open) return;
      open = next;
      opener.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('drawer-open', open);
      if (open) {
        drawer.hidden = false;
        if (scrim) scrim.hidden = false;
        // Let the element paint at its closed position before transitioning.
        requestAnimationFrame(function () {
          drawer.classList.add('is-open');
          if (scrim) scrim.classList.add('is-open');
        });
        if (main) main.setAttribute('inert', '');
        var first = drawer.querySelector(FOCUSABLE);
        if (first) first.focus();
      } else {
        drawer.classList.remove('is-open');
        if (scrim) scrim.classList.remove('is-open');
        if (main) main.removeAttribute('inert');
        var finish = function () {
          if (!open) {
            drawer.hidden = true;
            if (scrim) scrim.hidden = true;
          }
        };
        if (reduceMotion()) finish();
        else setTimeout(finish, 260);
        opener.focus();
      }
    }

    opener.addEventListener('click', function () {
      setOpen(!open);
    });
    var closer = drawer.querySelector('[data-nav-close]');
    if (closer) closer.addEventListener('click', function () { setOpen(false); });
    if (scrim) scrim.addEventListener('click', function () { setOpen(false); });

    // Following a link inside the drawer must close it — same-page anchors
    // would otherwise leave the panel covering the target.
    drawer.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a[href]')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      var items = drawer.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Resizing past the breakpoint must not strand an open drawer.
    var wide = window.matchMedia('(min-width: 1000px)');
    var onWide = function (e) {
      if (e.matches) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ----------------------------------------------------------- header CTA -- */

  /* "Get my verdict" scrolls to the calculator. While the calculator is
     already on screen the button is a no-op, so fade it out — but keep it in
     flow so the header never reflows. */
  function wireHeaderCta() {
    var cta = document.querySelector('.header-cta');
    var target = document.getElementById('calculator');
    if (!cta || !target || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        cta.classList.toggle('cta-hidden', entries[0].intersectionRatio >= 0.35);
      },
      { threshold: [0, 0.35, 1] },
    );
    io.observe(target);
  }

  /* --------------------------------------------------------------- reveal -- */

  /* The `.js-reveal` class is what makes .ro-reveal blocks start hidden. It is
     set HERE, by the same code that removes them again — so if this script
     never runs, the content simply renders. */
  function initReveal() {
    var els = document.querySelectorAll('.ro-reveal');
    if (!els.length) return;
    if (reduceMotion() || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* --------------------------------------------------------- hero examples -- */

  /* Three real results from the same engine the calculator calls, so a first-
     time visitor sees what a verdict actually looks like before typing
     anything. Regenerate with tools/hero-examples.mjs if the model changes. */
  var HERO_CASES = [
    {
      gauge: 26,
      verdict: 'repair',
      label: 'Repair it.',
      caseText: '$260 fan motor · 5-yr refrigerator · Chicago',
      detail: 'Keeping it costs $367 less over 13 years.',
    },
    {
      gauge: 96,
      verdict: 'replace',
      label: 'Replace it.',
      caseText: '$690 bearing job · 13-yr washer · Boston',
      detail: 'Replacing saves $907 over 12 years.',
    },
    {
      gauge: 42,
      verdict: 'repair',
      label: 'Lean toward repairing.',
      caseText: '$230 repair · 7-yr dryer · Atlanta',
      detail: "It's close — $68 apart over 13 years.",
    },
  ];

  function wireHeroDemo() {
    var root = document.querySelector('[data-hero-demo]');
    if (!root) return;
    var needle = root.querySelector('[data-hp-needle]');
    var dots = root.querySelectorAll('[data-hp-dot]');
    var caseEl = root.querySelector('[data-hp-case]');
    var verdictEl = root.querySelector('[data-hp-verdict]');
    var detailEl = root.querySelector('[data-hp-detail]');
    var i = 0;
    var timer = null;

    function show(next) {
      i = next % HERO_CASES.length;
      var c = HERO_CASES[i];
      needle.setAttribute('transform', 'rotate(' + (-90 + (c.gauge / 100) * 180) + ' 62 62)');
      caseEl.textContent = c.caseText;
      verdictEl.textContent = c.label;
      detailEl.textContent = c.detail;
      root.setAttribute('data-verdict', c.verdict);
      for (var d = 0; d < dots.length; d++) {
        dots[d].setAttribute('aria-pressed', String(d === i));
      }
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    for (var d = 0; d < dots.length; d++) {
      (function (idx) {
        dots[idx].addEventListener('click', function () {
          stop();
          show(idx);
        });
      })(d);
    }

    show(0);
    // Under reduced motion the panel stays on the first example.
    if (reduceMotion()) return;
    timer = setInterval(function () {
      show(i + 1);
    }, 4200);
    root.addEventListener('mouseenter', stop);
    root.addEventListener('focusin', stop);
  }

  /* ----------------------------------------------------------------- boot -- */

  function init() {
    var stamped = document.querySelector('[data-year]');
    if (stamped) {
      try {
        stamped.textContent = String(new Date().getFullYear());
      } catch (e) {}
    }
    wireTheme();
    wireDrawer();
    wireHeaderCta();
    wireHeroDemo();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
