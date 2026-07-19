/* =============================================================================
   RepairOrReplace — shared site chrome
   Injects a consistent header + footer on every page, wires the theme toggle,
   and highlights the active nav item. Pages opt out with <body data-no-chrome>.
   To avoid a flash of the wrong theme, pages should also include this snippet
   inline in <head>:
     <script>try{var t=localStorage.getItem('ror-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}</script>
   ========================================================================== */
(function () {
  'use strict';

  var LOGO =
    '<svg class="brand-logo" viewBox="0 0 40 40" fill="none" aria-hidden="true">' +
    '<defs><linearGradient id="rorlg" x1="0" y1="0" x2="40" y2="40">' +
    '<stop offset="0" stop-color="var(--brand)"/><stop offset="1" stop-color="var(--brand-strong)"/>' +
    '</linearGradient></defs>' +
    '<rect width="40" height="40" rx="11" fill="url(#rorlg)"/>' +
    '<path d="M13 16h12l-3-3M27 24H15l3 3" stroke="var(--on-brand)" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var NAV = [
    { href: '/', label: 'Calculator' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/guides/', label: 'Cost guides' },
    { href: '/about', label: 'About' },
  ];

  var SUN =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></svg>';
  var MOON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/></svg>';

  function currentPath() {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    return p;
  }

  function isActive(href) {
    var p = currentPath();
    if (href === '/') return p === '/';
    return p === href || p.indexOf(href) === 0;
  }

  function buildHeader() {
    var header = document.createElement('header');
    header.className = 'site-header';
    var links = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (isActive(n.href) ? ' aria-current="page"' : '') + '>' + n.label + '</a>';
    }).join('');
    header.innerHTML =
      '<div class="container">' +
      '<a class="brand-mark" href="/" aria-label="RepairOrReplace home">' +
      LOGO +
      '<span>Repair<span style="color:var(--brand-strong);padding:0 0.09em">or</span>Replace</span></a>' +
      '<nav class="nav" aria-label="Primary">' +
      links +
      '</nav>' +
      '<div class="header-actions">' +
      '<button class="theme-toggle" type="button" aria-label="Toggle dark mode" data-theme-toggle></button>' +
      '<a class="btn btn-primary" href="/#calculator">Start free</a>' +
      '</div></div>';
    return header;
  }

  function buildFooter() {
    var year = document.documentElement.getAttribute('data-year') || '';
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container"><div class="footer-grid">' +
      '<div><a class="brand-mark" href="/">' + LOGO +
      '<span>Repair<span style="color:var(--brand-strong);padding:0 0.09em">or</span>Replace</span></a>' +
      '<p class="muted" style="margin-top:var(--sp-4);max-width:34ch">The evidence-based way to decide whether to repair or replace a major appliance — no lead-capture wall, no guesswork.</p></div>' +
      '<div><h4>Product</h4><ul>' +
      '<li><a href="/">Calculator</a></li>' +
      '<li><a href="/how-it-works">How it works</a></li>' +
      '<li><a href="/guides/">Cost guides</a></li>' +
      '<li><a href="/for-pros">For technicians</a></li>' +
      '</ul></div>' +
      '<div><h4>Appliances</h4><ul>' +
      '<li><a href="/guides/refrigerator">Refrigerators</a></li>' +
      '<li><a href="/guides/washing-machine">Washing machines</a></li>' +
      '<li><a href="/guides/dishwasher">Dishwashers</a></li>' +
      '<li><a href="/guides/dryer">Dryers</a></li>' +
      '</ul></div>' +
      '<div><h4>Company</h4><ul>' +
      '<li><a href="/about">About</a></li>' +
      '<li><a href="/methodology">Methodology</a></li>' +
      '<li><a href="/privacy">Privacy</a></li>' +
      '<li><a href="/terms">Terms</a></li>' +
      '</ul></div>' +
      '</div>' +
      '<div class="footer-bottom">' +
      '<span>© ' + year + ' RepairOrReplace. Estimates only — not a technical diagnosis or safety certification.</span>' +
      '<span>Data: NAHB · InterNACHI · BLS · EIA · CPSC</span>' +
      '</div></div>';
    return footer;
  }

  function applyTheme(theme) {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
  }

  function currentTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function wireToggle() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    function render() {
      btn.innerHTML = currentTheme() === 'dark' ? SUN : MOON;
    }
    render();
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('ror-theme', next);
      } catch (e) {}
      render();
    });
  }

  function init() {
    // Stamp the year without Date in markup elsewhere.
    try {
      document.documentElement.setAttribute('data-year', String(new Date().getFullYear()));
    } catch (e) {}

    if (document.body.hasAttribute('data-no-chrome')) {
      wireToggle();
      return;
    }
    if (!document.querySelector('.site-header')) {
      document.body.insertBefore(buildHeader(), document.body.firstChild);
    }
    if (!document.querySelector('.site-footer')) {
      document.body.appendChild(buildFooter());
    }
    wireToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
