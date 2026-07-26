/* =============================================================================
   Stamp the canonical site chrome (tools/site-chrome.mjs) into every page.

     node tools/render-chrome.mjs          # rewrite every page under public/ in place
     node tools/render-chrome.mjs --check  # exit 1 if any page is out of date

   The blocks are delimited by ror:chrome markers so the operation is
   idempotent: running it twice is a no-op, and `--check` in CI catches a page
   whose chrome has drifted from the template.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { header, footer, skipLink } from './site-chrome.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const CHECK = process.argv.includes('--check');

const OPEN_TOP = '<!-- ror:chrome:top -->';
const CLOSE_TOP = '<!-- /ror:chrome:top -->';
const OPEN_BOTTOM = '<!-- ror:chrome:bottom -->';
const CLOSE_BOTTOM = '<!-- /ror:chrome:bottom -->';

/** public/guides/index.html -> /guides/ ; public/about.html -> /about */
function routeFor(file) {
  const rel = path.relative(PUBLIC, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Replace the region between markers, or insert it at `fallbackInsert`. */
function spliceBlock(html, open, close, body, insert) {
  const block = `${open}\n${body}\n${close}`;
  const start = html.indexOf(open);
  if (start !== -1) {
    const end = html.indexOf(close, start);
    if (end === -1) throw new Error(`unbalanced marker ${open}`);
    return html.slice(0, start) + block + html.slice(end + close.length);
  }
  return insert(html, block);
}

const YEAR = String(new Date().getFullYear());
let changed = 0;
const stale = [];

for (const file of walk(PUBLIC).sort()) {
  const original = fs.readFileSync(file, 'utf8');
  let html = original;
  const route = routeFor(file);

  // Drop any hand-written skip link — the template owns it now.
  html = html.replace(/[ \t]*<a class="skip-link"[\s\S]*?<\/a>\n?/g, '');

  html = spliceBlock(
    html,
    OPEN_TOP,
    CLOSE_TOP,
    `${skipLink()}\n${header(route)}`,
    (h, block) => h.replace(/(<body[^>]*>)/i, `$1\n${block}`),
  );

  html = spliceBlock(html, OPEN_BOTTOM, CLOSE_BOTTOM, footer(YEAR), (h, block) =>
    h.replace(/(\n?[ \t]*<\/body>)/i, `\n${block}$1`),
  );

  // The skip link needs a focusable target.
  html = html.replace(/<main(?![^>]*tabindex)([^>]*)>/i, '<main$1 tabindex="-1">');

  if (html !== original) {
    stale.push(path.relative(ROOT, file));
    changed++;
    if (!CHECK) fs.writeFileSync(file, html);
  }
}

if (CHECK && changed) {
  console.error(`Site chrome is out of date in ${changed} file(s):\n  ${stale.join('\n  ')}`);
  console.error('Run: npm run chrome');
  process.exit(1);
}
console.log(CHECK ? 'Site chrome is up to date.' : `Site chrome stamped into ${changed} file(s).`);
