/* =============================================================================
   Page hygiene check.

     node tools/check-pages.mjs

   Asserts the things that silently rot across 26 hand-written HTML files and
   that nothing else in the toolchain would catch: over-long social metadata,
   missing or duplicated cards, broken internal links, malformed JSON-LD,
   heading-order skips, and unreachable scroll regions.

   Exits non-zero with a per-file report. Run it before shipping.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const DESC_MAX = 158;
const DESC_MIN = 110;
const TITLE_MAX = 60;

const problems = [];
const fail = (file, rule, detail) =>
  problems.push({ file: path.relative(ROOT, file), rule, detail });

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Minimal entity decode — enough to measure a meta attribute honestly. */
function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function meta(html, key, attr = 'name') {
  const re = new RegExp(
    `<meta[^>]*\\b${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i',
  );
  const tag = html.match(re);
  if (!tag) return null;
  const content = tag[0].match(/\bcontent=["']([\s\S]*?)["']/i);
  return content ? decode(content[1]) : '';
}

/** Does an internal href resolve to something we actually ship? */
function resolves(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return true;
  // /api/* is served by the Worker, not the assets binding.
  if (clean.startsWith('/api/')) return true;
  const rel = clean.replace(/^\//, '');
  const candidates = [
    path.join(PUBLIC, rel),
    path.join(PUBLIC, rel + '.html'),
    path.join(PUBLIC, rel, 'index.html'),
  ];
  return candidates.some((c) => fs.existsSync(c));
}

const files = walk(PUBLIC).sort();
const seenDesc = new Map();
const seenTitle = new Map();
const seenCard = new Map();

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(PUBLIC, file);

  // --- generated chrome must be intact ---
  for (const m of ['ror:chrome:top', 'ror:chrome:bottom']) {
    const open = html.split(`<!-- ${m} -->`).length - 1;
    const close = html.split(`<!-- /${m} -->`).length - 1;
    if (open !== 1 || close !== 1) {
      fail(file, 'chrome-markers', `${m}: ${open} open / ${close} close (expected 1/1)`);
    }
  }

  // --- title ---
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title) fail(file, 'title', 'missing');
  else {
    const t = decode(title).trim();
    if (t.length > TITLE_MAX) fail(file, 'title-length', `${t.length} chars (max ${TITLE_MAX})`);
    if (seenTitle.has(t)) fail(file, 'title-duplicate', `same as ${seenTitle.get(t)}`);
    else seenTitle.set(t, rel);
  }

  // --- description ---
  const desc = meta(html, 'description');
  if (desc === null) fail(file, 'description', 'missing');
  else {
    if (desc.length > DESC_MAX) fail(file, 'description-length', `${desc.length} chars (max ${DESC_MAX})`);
    if (desc.length < DESC_MIN) fail(file, 'description-length', `${desc.length} chars (min ${DESC_MIN})`);
    if (seenDesc.has(desc)) fail(file, 'description-duplicate', `same as ${seenDesc.get(desc)}`);
    else seenDesc.set(desc, rel);
  }

  // --- icons: one source of truth, no surviving data: URIs ---
  if (/rel=["']icon["'][^>]*href=["']data:/i.test(html)) {
    fail(file, 'icon', 'inline data: URI favicon (use /icon.svg)');
  }
  if (!/rel=["']icon["'][^>]*href=["']\/icon\.svg["']/i.test(html)) {
    fail(file, 'icon', 'missing <link rel="icon" href="/icon.svg">');
  }

  // --- theme-color must carry both schemes ---
  const themeTags = html.match(/<meta[^>]*name=["']theme-color["'][^>]*>/gi) || [];
  if (themeTags.length !== 2 || !themeTags.every((t) => /media=/.test(t))) {
    fail(file, 'theme-color', `${themeTags.length} tag(s); expected a light+dark media-qualified pair`);
  }

  // --- social card ---
  for (const [key, attr] of [
    ['og:type', 'property'],
    ['og:site_name', 'property'],
    ['og:url', 'property'],
    ['og:title', 'property'],
    ['og:description', 'property'],
    ['og:image', 'property'],
    ['og:image:width', 'property'],
    ['og:image:height', 'property'],
    ['og:image:alt', 'property'],
    ['twitter:card', 'name'],
    ['twitter:title', 'name'],
    ['twitter:image', 'name'],
  ]) {
    if (meta(html, key, attr) === null) fail(file, 'social', `missing ${key}`);
  }
  const card = meta(html, 'og:image', 'property');
  if (card) {
    if (!/^https:\/\//.test(card)) fail(file, 'social', `og:image is not absolute: ${card}`);
    const local = path.join(PUBLIC, card.replace(/^https:\/\/[^/]+\//, ''));
    if (!fs.existsSync(local)) fail(file, 'social', `og:image file missing: ${card}`);
    if (!seenCard.has(card)) seenCard.set(card, []);
    seenCard.get(card).push(rel);
  }

  // --- scrollable tables must be reachable ---
  for (const wrap of html.match(/<div class="table-wrap"[^>]*>/g) || []) {
    if (!/tabindex=["']0["']/.test(wrap) || !/aria-label=/.test(wrap)) {
      fail(file, 'table-wrap', `not keyboard-reachable: ${wrap.slice(0, 90)}`);
    }
  }

  // --- JSON-LD must parse ---
  for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []) {
    const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    try {
      JSON.parse(body);
    } catch (e) {
      fail(file, 'json-ld', e.message.slice(0, 120));
    }
  }

  // --- heading order inside <main> ---
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [])[0] || '';
  let prev = 0;
  for (const h of main.match(/<h([1-6])\b/gi) || []) {
    const level = Number(h.slice(-1));
    if (prev && level > prev + 1) fail(file, 'heading-order', `h${prev} -> h${level}`);
    prev = level;
  }

  // --- internal links must resolve ---
  for (const m of html.matchAll(/href=["'](\/[^"'#?]*)["']/g)) {
    if (!resolves(m[1])) fail(file, 'dead-link', m[1]);
  }
}

// Cards that are supposed to be unique per page.
for (const [card, pages] of seenCard) {
  if (pages.length > 1 && !/\/og\.png$/.test(card)) {
    fail(path.join(PUBLIC, pages[0]), 'social', `card reused by ${pages.length} pages: ${card}`);
  }
}

if (problems.length) {
  const byFile = new Map();
  for (const p of problems) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file).push(p);
  }
  for (const [file, list] of byFile) {
    console.error(`\n${file}`);
    for (const p of list) console.error(`  [${p.rule}] ${p.detail}`);
  }
  console.error(`\n${problems.length} problem(s) across ${byFile.size} file(s).`);
  process.exit(1);
}
console.log(`Page hygiene OK — ${files.length} files checked.`);
