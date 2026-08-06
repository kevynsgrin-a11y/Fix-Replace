/* =============================================================================
   RepairOrReplace — canonical site chrome
   Single source of truth for the header, footer and skip link that every page
   ships as STATIC markup. `tools/render-chrome.mjs` stamps the output of these
   functions into every file under public/ between the ror:chrome markers.

   Chrome must be static, not JS-injected: it is the site's entire internal
   link graph, it owns the page landmarks, and injecting it after parse costs a
   layout shift on every navigation.

   public/scripts/chrome.js only *enhances* what these functions emit — it
   never builds it. If you change markup here, re-run:  npm run chrome
   ========================================================================== */

/* Four items, not five: at five the header row filled its content box exactly
   at every width, leaving the theme toggle crowding the last link. "About"
   lives in the drawer and the footer, which is where it earns its place. */
export const NAV = [
  { href: '/', label: 'Calculator' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/guides/', label: 'Cost guides' },
  { href: '/appliance-repair-cost/', label: 'Local costs' },
];

/* The drawer has room for the full map, so it carries the secondary
   destinations the header cannot. */
const DRAWER_EXTRA = [
  { href: '/methodology', label: 'Methodology' },
  { href: '/recalls', label: 'Recall checks' },
  { href: '/for-pros', label: 'For technicians' },
  { href: '/about', label: 'About' },
];

/* The mark appears three times per page (header, drawer, footer). Each copy
   needs its own gradient id — three elements sharing id="rorlg" is invalid
   HTML and leaves the fill referencing whichever one parsed first. */
const logo = (id) =>
  `<svg class="brand-logo" viewBox="0 0 40 40" fill="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="40" y2="40"><stop offset="0" stop-color="var(--brand)"/><stop offset="1" stop-color="var(--brand-strong)"/></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#${id})"/><path d="M13 16h12l-3-3M27 24H15l3 3" stroke="var(--on-brand)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const WORDMARK = `<span>Repair<span class="brand-or">or</span>Replace</span>`;

const MENU_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><path d="M3.5 7h17M3.5 12h17M3.5 17h17"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

/**
 * How `href` relates to the page being rendered.
 *
 * Only an exact match is the current *page*. A section hub whose child we are
 * on ("Cost guides" while viewing /guides/refrigerator) is still worth
 * highlighting, but announcing it as aria-current="page" tells a screen-reader
 * user they are on a page they are not. "true" marks it as the current item in
 * the set without that false claim.
 */
export function currentKind(href, path) {
  if (href === '/') return path === '/' ? 'page' : null;
  if (path === href) return 'page';
  return path.indexOf(href) === 0 ? 'section' : null;
}

/** The aria-current attribute (including leading space), or ''. */
export function currentAttr(href, path) {
  const kind = currentKind(href, path);
  if (kind === 'page') return ' aria-current="page"';
  if (kind === 'section') return ' aria-current="true"';
  return '';
}

/** Does `href` represent the page currently being rendered? */
export function isActive(href, path) {
  return currentKind(href, path) !== null;
}

export function skipLink() {
  return `<a class="skip-link" href="#main">Skip to main content</a>`;
}

export function header(path) {
  const links = NAV.map(
    (n) =>
      `<a href="${n.href}"${currentAttr(n.href, path)}>${n.label}</a>`,
  ).join('');
  const drawerLinks = NAV.concat(DRAWER_EXTRA)
    .map(
      (n) =>
        `<li><a href="${n.href}"${currentAttr(n.href, path)}>${n.label}</a></li>`,
    )
    .join('');

  return `<header class="site-header">
  <div class="container">
    <a class="brand-mark" href="/" aria-label="RepairOrReplace home">${logo('rorlg-header')}${WORDMARK}</a>
    <nav class="nav" aria-label="Primary">${links}</nav>
    <div class="header-actions">
      <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark theme"></button>
      <a class="btn btn-primary header-cta" href="/#calculator">Get my verdict</a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-drawer" aria-label="Open menu">${MENU_ICON}</button>
    </div>
  </div>
</header>
<div class="drawer-scrim" data-drawer-scrim hidden></div>
<div class="site-drawer" id="site-drawer" data-drawer hidden role="dialog" aria-modal="true" aria-label="Menu">
  <div class="drawer-head">
    <span class="brand-mark">${logo('rorlg-drawer')}${WORDMARK}</span>
    <button class="nav-toggle" type="button" data-nav-close aria-label="Close menu">${CLOSE_ICON}</button>
  </div>
  <nav aria-label="Mobile"><ul class="drawer-nav">${drawerLinks}</ul></nav>
  <div class="drawer-foot">
    <button class="drawer-theme" type="button" data-theme-toggle aria-pressed="false">
      <span data-theme-label>Switch to dark theme</span>
    </button>
    <a class="btn btn-primary btn-lg btn-block" href="/#calculator">Get my verdict</a>
    <p class="drawer-legal">Free · No sign-up · Estimates only.</p>
  </div>
</div>`;
}

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      ['/', 'Calculator'],
      ['/how-it-works', 'How it works'],
      ['/methodology', 'Methodology'],
      ['/appliance-repair-cost/', 'Local repair costs'],
      ['/recalls', 'Recall checks'],
      ['/for-pros', 'For technicians'],
    ],
  },
  {
    title: 'Popular guides',
    links: [
      ['/guides/refrigerator', 'Refrigerators'],
      ['/guides/washing-machine', 'Washing machines'],
      ['/guides/dishwasher', 'Dishwashers'],
      ['/guides/dryer', 'Dryers'],
      ['/guides/oven', 'Wall ovens'],
      ['/guides/range', 'Ranges'],
      ['/guides/microwave', 'Microwaves'],
      ['/guides/water-heater', 'Water heaters'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['/about', 'About'],
      ['/guides/', 'All cost guides'],
      ['/privacy', 'Privacy'],
      ['/terms', 'Terms'],
    ],
  },
];

export function footer(year) {
  const cols = FOOTER_COLUMNS.map(
    (c) =>
      `<div><h2>${c.title}</h2><ul>` +
      c.links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('') +
      `</ul></div>`,
  ).join('');

  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <h2 class="sr-only">RepairOrReplace</h2>
        <a class="brand-mark" href="/">${logo('rorlg-footer')}${WORDMARK}</a>
        <p class="muted footer-blurb">The evidence-based way to decide whether to repair or replace a major appliance — no lead-capture wall, no guesswork.</p>
      </div>
      ${cols}
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>${year}</span> RepairOrReplace. Estimates only — not a technical diagnosis or safety certification.</span>
      <span>Data: NAHB · InterNACHI · BLS · EIA · CPSC</span>
    </div>
  </div>
</footer>`;
}
