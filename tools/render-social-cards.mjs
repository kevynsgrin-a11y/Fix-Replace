/* =============================================================================
   Render the RepairOrReplace social-card set.

     node tools/render-social-cards.mjs

   Writes public/social/og-*.png at 2400x1260 (2x of the 1200x630 OG spec).
   public/og.png — the site-wide default — is public/social/og.png copied up a
   level; re-copy it after a regen. Chromium comes from playwright-core.
   ========================================================================== */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = process.argv[2] || path.join(ROOT, 'public', 'social');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- signature gauge (drawn correctly: one continuous 180° arc) ------ */
function gauge(pos = 68) {
  const cx = 190, cy = 200, r = 158;
  const a = Math.PI * (1 - pos / 100);
  const nx = cx + Math.cos(a) * (r - 34);
  const ny = cy - Math.sin(a) * (r - 34);
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const t = Math.PI * (1 - i / 10);
    const major = i % 5 === 0;
    const r1 = r + 16, r2 = r + (major ? 32 : 25);
    ticks.push(
      `<line x1="${(cx + Math.cos(t) * r1).toFixed(1)}" y1="${(cy - Math.sin(t) * r1).toFixed(1)}"
             x2="${(cx + Math.cos(t) * r2).toFixed(1)}" y2="${(cy - Math.sin(t) * r2).toFixed(1)}"
             stroke="${major ? 'rgba(194,205,221,.55)' : 'rgba(139,153,173,.32)'}"
             stroke-width="${major ? 3 : 2}" stroke-linecap="round"/>`,
    );
  }
  return `
  <div class="gauge">
  <svg width="380" height="270" viewBox="0 0 380 270" fill="none">
    <defs>
      <linearGradient id="arc" x1="${cx - r}" y1="0" x2="${cx + r}" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#2fca8a"/>
        <stop offset=".5" stop-color="#8ea3bd"/>
        <stop offset="1" stop-color="#f0a13a"/>
      </linearGradient>
      <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="11"/>
      </filter>
    </defs>
    ${ticks.join('')}
    <path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" stroke="url(#arc)"
          stroke-width="26" stroke-linecap="round" opacity=".28" filter="url(#soft)"/>
    <path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" stroke="rgba(255,255,255,.07)"
          stroke-width="26" stroke-linecap="round"/>
    <path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" stroke="url(#arc)"
          stroke-width="26" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"
          stroke="#f2f6fc" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="17" fill="#0f1826" stroke="#f2f6fc" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="#f2f6fc"/>
    <text x="${cx - r + 6}" y="${cy + 40}" fill="#2fca8a" font-size="19" font-weight="700"
          font-family="ui-sans-serif,system-ui,sans-serif" letter-spacing=".1em">REPAIR</text>
    <text x="${cx + r - 6}" y="${cy + 40}" fill="#f0a13a" font-size="19" font-weight="700"
          text-anchor="end" font-family="ui-sans-serif,system-ui,sans-serif" letter-spacing=".1em">REPLACE</text>
  </svg>
  </div>`;
}

/* ---------- appliance spot art (line-instrument style, matches site art) ---- */
const SPOT = {
  refrigerator: `<rect x="26" y="14" width="116" height="196" rx="18"/><path d="M26 96h116"/>
    <path d="M50 58v22M50 116v26"/>`,
  'washing-machine': `<rect x="20" y="20" width="128" height="184" rx="18"/><circle cx="84" cy="128" r="46"/>
    <circle cx="84" cy="128" r="26"/><path d="M40 52h30M118 52h8"/>`,
  dishwasher: `<rect x="20" y="18" width="128" height="188" rx="16"/><path d="M20 66h128"/>
    <path d="M46 42h60"/><path d="M52 100h64M52 130h64M52 160h40"/>`,
  dryer: `<rect x="20" y="20" width="128" height="184" rx="18"/><circle cx="84" cy="130" r="48"/>
    <path d="M60 130a24 24 0 0 1 48 0" /><path d="M40 52h26M114 52h14"/>`,
  range: `<rect x="18" y="52" width="132" height="154" rx="14"/><path d="M18 108h132"/>
    <circle cx="52" cy="80" r="12"/><circle cx="116" cy="80" r="12"/><path d="M46 140h76"/>`,
  oven: `<rect x="22" y="26" width="124" height="180" rx="16"/><rect x="44" y="76" width="80" height="98" rx="10"/>
    <circle cx="56" cy="50" r="9"/><circle cx="112" cy="50" r="9"/>`,
  microwave: `<rect x="12" y="52" width="144" height="118" rx="14"/><rect x="30" y="70" width="86" height="82" rx="8"/>
    <path d="M132 76v70"/><circle cx="132" cy="90" r="6"/>`,
  'water-heater': `<rect x="34" y="18" width="100" height="192" rx="46"/><path d="M34 150h100"/>
    <path d="M56 18v-8M112 18v-8"/><circle cx="84" cy="180" r="12"/>`,
  city: `<path d="M12 208h152"/><rect x="20" y="118" width="38" height="90"/><rect x="66" y="70" width="42" height="138"/>
    <rect x="116" y="146" width="40" height="62"/><path d="M30 136h8M30 158h8M30 180h8M78 90h8M78 116h8M78 142h8M78 168h8M126 166h8M126 188h8"/>`,
  math: `<path d="M18 200 C 56 200, 74 150, 96 108 S 140 34, 162 24"/><path d="M18 24v176h150"/>
    <circle cx="96" cy="108" r="10"/><path d="M40 176h18M40 152h34"/>`,
};

function spot(name) {
  const d = SPOT[name];
  if (!d) return '';
  return `<div class="spot"><svg width="330" height="330" viewBox="-8 -8 184 236" fill="none"
    stroke="rgba(194,205,221,.62)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <g opacity=".95">${d}</g>
    <path d="M-8 -8h30M-8 -8v30M168 220h-30M168 220v-30" stroke="#2fca8a" stroke-width="4"/>
  </svg></div>`;
}

/* ---------- the card set ---------------------------------------------------- */
const CARDS = [
  { file: 'og.png', eyebrow: 'The math, not a guess', h1: 'Should you <span class="rep">repair</span> or <span class="rpl">replace</span> it?', sub: 'An evidence-based verdict for any major appliance — in seconds, with no sign-up.', art: gauge(68) },
  { file: 'og-how-it-works.png', eyebrow: 'How it works', h1: 'A real cost model,<br>not a rule of thumb.', sub: 'Net present cost, Weibull survival, local labor and energy — every number sourced.', art: spot('math'), h1size: 60 },
  { file: 'og-methodology.png', eyebrow: 'Methodology', h1: 'Every number<br>has a source.', sub: 'NAHB, InterNACHI, BLS OEWS, EIA and CPSC — cited line by line.', art: spot('math'), h1size: 62 },
  { file: 'og-guides.png', eyebrow: 'Cost guides', h1: 'Know before you<br>get the quote.', sub: 'Typical repair costs, lifespans and break-even points for 8 major appliances.', art: spot('refrigerator'), h1size: 62 },
  { file: 'og-cities.png', eyebrow: 'Local costs', h1: 'What a repair really<br>costs where you live.', sub: 'Labor rates and energy prices localized to 22 metro markets.', art: spot('city'), h1size: 56 },
  { file: 'og-recalls.png', eyebrow: 'Recall check', h1: 'An open recall changes<br>the whole calculation.', sub: 'We check the CPSC federal recall database before we price the repair.', art: spot('math'), h1size: 54 },
  { file: 'og-for-pros.png', eyebrow: 'For technicians', h1: 'Let a neutral third party<br>vouch for your quote.', sub: 'Send customers an independent, sourced repair-or-replace analysis.', art: spot('math'), h1size: 52 },
  { file: 'og-about.png', eyebrow: 'About', h1: 'The honest answer to one<br>expensive question.', sub: 'No lead-capture wall, no fabricated precision, no verdict for sale.', art: spot('math'), h1size: 52 },
];

const GUIDES = [
  ['refrigerator', 'Refrigerator', 'Sealed-system faults can rival a new unit. Here is how to tell a cheap fix from a write-off.'],
  ['washing-machine', 'Washing machine', 'Bearings and transmissions decide it. Pumps and valves almost never do.'],
  ['dishwasher', 'Dishwasher', 'Cheap to fix until the control board or the tub goes. Then the math flips.'],
  ['dryer', 'Dryer', 'One of the most repair-friendly appliances in the house — with two exceptions.'],
  ['range', 'Range', 'Gas or electric changes both the risk profile and the break-even point.'],
  ['oven', 'Wall oven', 'Built-in replacement carries install cost that a freestanding unit does not.'],
  ['microwave', 'Microwave', 'Over-the-range units are worth fixing far more often than countertop ones.'],
  ['water-heater', 'Water heater', 'Age beats symptom here: a tank past 10 years rarely earns a repair.'],
];
for (const [slug, label, sub] of GUIDES) {
  CARDS.push({
    file: `og-guide-${slug}.png`,
    eyebrow: `${label} guide`,
    h1: `${label}:<br><span class="rep">repair</span> or <span class="rpl">replace</span>?`,
    sub,
    art: spot(slug),
    h1size: 58,
  });
}

const CITIES = [
  ['new-york', 'New York'], ['los-angeles', 'Los Angeles'], ['chicago', 'Chicago'],
  ['boston', 'Boston'], ['miami', 'Miami'], ['minneapolis', 'Minneapolis'],
];
for (const [slug, label] of CITIES) {
  CARDS.push({
    file: `og-city-${slug}.png`,
    eyebrow: `${label} repair costs`,
    h1: `Appliance repair<br>cost in ${label}`,
    sub: 'Local labor rates, energy prices and break-even points — not a national average.',
    art: spot('city'),
    h1size: 56,
  });
}

/* ---------- render ---------------------------------------------------------- */
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + path.join(HERE, 'social-card-template.html'));

/* Palette-quantise when sharp is available (it ships transitively with wrangler).
   Cuts each 2400x1260 card from ~500KB to ~150KB with no visible banding. */
let sharp = null;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.warn('sharp unavailable — writing unoptimised PNGs');
}

for (const c of CARDS) {
  await page.evaluate((c) => {
    document.getElementById('eyebrow').textContent = c.eyebrow;
    document.getElementById('headline').innerHTML = c.h1;
    document.getElementById('sub').textContent = c.sub;
    document.getElementById('art').innerHTML = c.art || '';
    document.documentElement.style.setProperty('--h1', (c.h1size || 68) + 'px');
  }, c);
  const dest = path.join(OUT, c.file);
  const buf = await page.screenshot({ type: 'png' });
  if (sharp) await sharp(buf).png({ palette: true, quality: 90, effort: 10 }).toFile(dest);
  else fs.writeFileSync(dest, buf);
}
await browser.close();

const total = CARDS.reduce((n, c) => n + fs.statSync(path.join(OUT, c.file)).size, 0);
console.log(`rendered ${CARDS.length} cards -> ${OUT} (${(total / 1024 / 1024).toFixed(2)} MB)`);
