import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
// glyph inset differs per purpose: iOS masks apple-touch-icon to a squircle and
// maskable icons are cropped to a 40% safe zone, so both need extra padding.
const card = (size, radius, pad) => `<!doctype html><html><head><style>
 *{margin:0;padding:0} html,body{width:${size}px;height:${size}px}
 body{background:#0d7c66;display:grid;place-items:center;border-radius:${radius}px;overflow:hidden}
 svg{width:${Math.round(size*pad)}px;height:${Math.round(size*pad)}px}
</style></head><body>
 <svg viewBox="0 0 40 40" fill="none"><path d="M13 16h12l-3-3M27 24H15l3 3" stroke="#fff" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
</body></html>`;
const specs = [
  ['public/apple-touch-icon.png', 180, 0, 0.62],
  ['public/icon-192.png', 192, 42, 0.62],
  ['public/icon-512.png', 512, 112, 0.62],
  ['public/icon-maskable-512.png', 512, 0, 0.44],
];
for (const [out, size, radius, pad] of specs) {
  const ctx = await b.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(card(size, radius, pad));
  fs.writeFileSync(out, await p.screenshot({ omitBackground: radius > 0 }));
  await ctx.close();
}
await b.close();
console.log('icons written');
