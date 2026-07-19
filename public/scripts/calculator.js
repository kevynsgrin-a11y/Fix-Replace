/* =============================================================================
   RepairOrReplace — calculator client (vanilla ES module, no libraries)

   Responsibilities
   - Fetch /api/catalog and build the intake form dynamically.
   - Serialize inputs, POST /api/calculate, render a rich result experience.
   - Export renderResult() + renderState() so r.html can reuse the exact same
     result panel for a saved/shared result.

   Auto-initialises the homepage calculator only when #intake-form is present,
   so importing this module from r.html (which has no form) is side-effect free.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   Small utilities
   -------------------------------------------------------------------------- */

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const money0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Escape untrusted strings before injecting as HTML. */
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Scheme-allowlist a URL before it is placed in an href. Shared/saved results
 * (via /api/report) are attacker-controllable, so a bare esc() is not enough:
 * a `javascript:` URI survives HTML-escaping and would execute on click. Only
 * http(s), root-relative, and mailto URLs are allowed through; anything else
 * collapses to '#'.
 */
function safeHref(value) {
  const raw = String(value === null || value === undefined ? '' : value).trim();
  if (!raw) return '#';
  // Root-relative (but not protocol-relative "//host") links are safe.
  if (raw[0] === '/' && raw[1] !== '/') return raw;
  try {
    const base = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://x';
    const u = new URL(raw, base);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') return u.href;
  } catch (e) {
    /* fall through */
  }
  return '#';
}

function fmtMoney(n) {
  if (!Number.isFinite(n)) return '$—';
  return money0.format(Math.round(n));
}

function fmtPct(fraction, digits = 0) {
  if (!Number.isFinite(fraction)) return '—';
  return `${(fraction * 100).toFixed(digits)}%`;
}

function fmtYears(n) {
  if (!Number.isFinite(n)) return '—';
  const v = Math.round(n * 10) / 10;
  return `${v} yr${Math.abs(v - 1) < 0.05 ? '' : 's'}`;
}

/** Turn a month count into a friendly "2 yrs 3 mos" / "within its life" phrase. */
function fmtBreakEven(months) {
  if (months === null || months === undefined) return null;
  if (!Number.isFinite(months) || months <= 0) return 'immediately';
  const whole = Math.round(months);
  const y = Math.floor(whole / 12);
  const m = whole % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y === 1 ? '' : 's'}`);
  if (m) parts.push(`${m} mo${m === 1 ? '' : 's'}`);
  return parts.join(' ') || '< 1 mo';
}

/** Animate a numeric element from 0 to a target value. */
function countUp(el, to, render) {
  if (!el) return;
  if (REDUCED_MOTION) {
    el.textContent = render(to);
    return;
  }
  const duration = 750;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = render(to * eased);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = render(to);
  }
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Inline icons (no external assets)
   -------------------------------------------------------------------------- */

const ICON = {
  scale:
    '<path d="M12 3v18M12 6l7 2M12 6 5 8m0 0-3 7a4 4 0 0 0 6 0l-3-7Zm14 0-3 7a4 4 0 0 0 6 0l-3-7ZM6 21h12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wrench:
    '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.5 2.5-2.3-.6-.6-2.3 2.4-2.6Z"/>',
  bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
  gauge: '<path d="M12 13l4-4M3 18a9 9 0 1 1 18 0"/><circle cx="12" cy="13" r="1.6"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/>',
  alert:
    '<path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M19 3v16"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5 15.4 17M15.4 7 8.6 10.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  external: '<path d="M15 3h6v6M21 3l-9 9M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>',
  recall: '<path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8"/><path d="M3 4v4h4"/>',
};

function svg(name, cls = 'panel-icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;
}

/* --------------------------------------------------------------------------
   Result rendering
   -------------------------------------------------------------------------- */

const VERDICT_META = {
  repair: { eyebrow: 'The verdict', label: 'Repair', icon: 'wrench' },
  replace: { eyebrow: 'The verdict', label: 'Replace', icon: 'bolt' },
  uncertain: { eyebrow: 'Needs a closer look', label: 'Second opinion', icon: 'alert' },
};

const CONFIDENCE_LABEL = {
  high: 'High confidence',
  moderate: 'Moderate confidence',
  low: 'Low confidence',
  suppressed: 'Withheld',
};

function verdictTags(r) {
  const tags = [];
  const conf = r.confidence || {};
  const level = conf.level || 'moderate';
  const confClass =
    level === 'high' ? 'badge-repair' : level === 'low' || level === 'suppressed' ? 'badge-replace' : 'badge-brand';
  tags.push(`<span class="badge ${confClass} badge-dot">${esc(CONFIDENCE_LABEL[level] || 'Confidence')} · ${Math.round(conf.score ?? 0)}/100</span>`);

  if (r.recall && r.recall.status === 'active') {
    tags.push('<span class="badge badge-danger badge-dot">Open recall</span>');
  }
  if (r.resolvedInput && r.resolvedInput.underWarranty) {
    tags.push('<span class="badge badge-brand">Under warranty</span>');
  }
  const be = r.npc ? fmtBreakEven(r.npc.breakEvenMonths) : null;
  if (r.verdict === 'replace' && be) {
    tags.push(`<span class="badge">Break-even in ${esc(be)}</span>`);
  }
  return `<div class="verdict-tags">${tags.join('')}</div>`;
}

function gaugeMarkup(pos) {
  // Semicircle: centre (160,168), radius 148 → left (12,168) … right (308,168)
  return `
    <div class="gauge">
      <svg class="gauge-svg" viewBox="0 0 320 176" role="img"
           aria-label="Repair-to-replace gauge, ${pos} out of 100 toward replace">
        <defs>
          <linearGradient id="ggrad" x1="12" y1="0" x2="308" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="var(--repair)"/>
            <stop offset="0.5" stop-color="var(--uncertain)"/>
            <stop offset="1" stop-color="var(--replace)"/>
          </linearGradient>
        </defs>
        <path d="M12 168 A148 148 0 0 1 308 168" fill="none"
              stroke="var(--surface-3)" stroke-width="20" stroke-linecap="round"/>
        <path d="M12 168 A148 148 0 0 1 308 168" fill="none"
              stroke="url(#ggrad)" stroke-width="20" stroke-linecap="round"
              opacity="0.92"/>
        <g class="gauge-needle" data-gauge-needle data-pos="${pos}" transform="rotate(-90 160 168)">
          <line x1="160" y1="168" x2="160" y2="34" stroke="var(--ink)" stroke-width="4.5" stroke-linecap="round"/>
        </g>
        <circle cx="160" cy="168" r="11" fill="var(--surface)" stroke="var(--ink)" stroke-width="3.5"/>
      </svg>
      <div class="gauge-labels">
        <span class="g-repair">Repair</span>
        <span class="g-replace">Replace</span>
      </div>
      <div class="gauge-readout"><b class="tnum">${pos}</b>/100 toward replacing</div>
    </div>`;
}

function verdictMarkup(r) {
  const meta = VERDICT_META[r.verdict] || VERDICT_META.uncertain;
  let visual;
  if (r.verdict === 'uncertain' || r.gaugePosition === null || r.gaugePosition === undefined) {
    visual = `
      <div class="gauge">
        <div class="gauge-uncertain">
          ${svg('alert', '')}
          <b>No verdict</b>
          <span>Get a second opinion</span>
        </div>
      </div>`;
  } else {
    visual = gaugeMarkup(r.gaugePosition);
  }

  const warnings =
    r.confidence && r.confidence.warnings && r.confidence.warnings.length
      ? `<div class="callout callout-warn" role="note" style="margin-top:var(--sp-2)">
           ${svg('alert', 'callout-icon')}
           <div>
             <h4>Why we're holding back</h4>
             <ul>${r.confidence.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
           </div>
         </div>`
      : '';

  return `
    <section class="rr-verdict card" data-verdict="${esc(r.verdict)}" aria-labelledby="verdict-headline">
      ${visual}
      <div class="verdict-body">
        <span class="verdict-eyebrow">${svg(meta.icon, 'panel-icon')} ${esc(meta.eyebrow)}</span>
        <h2 class="verdict-headline" id="verdict-headline">${esc(r.verdictHeadline)}</h2>
        <p class="verdict-explain">${esc(r.verdictExplanation)}</p>
        ${verdictTags(r)}
        ${warnings}
      </div>
    </section>`;
}

function npcMarkup(r) {
  const npc = r.npc || {};
  const repair = Math.max(0, npc.repair ?? 0);
  const replace = Math.max(0, npc.replace ?? 0);
  const max = Math.max(repair, replace, 1);
  const repairWins = repair <= replace;
  const be = fmtBreakEven(npc.breakEvenMonths);
  const beText =
    npc.breakEvenMonths === null || npc.breakEvenMonths === undefined
      ? 'Replacing never fully pays back within the horizon.'
      : `Replacing breaks even in <b>${esc(be)}</b>.`;

  const bd = (title, b) => `
    <div class="breakdown-col">
      <h4>${title}</h4>
      <div class="breakdown-line"><span>Upfront</span><b class="tnum">${fmtMoney(b.upfront)}</b></div>
      <div class="breakdown-line"><span>Energy (present value)</span><b class="tnum">${fmtMoney(b.energyPresentValue)}</b></div>
      <div class="breakdown-line"><span>Salvage credit</span><b class="tnum">${b.salvageCredit ? '−' + fmtMoney(b.salvageCredit) : fmtMoney(0)}</b></div>
      <div class="breakdown-line"><span>Risk adjustment</span><b class="tnum">${fmtMoney(b.riskAdjustment)}</b></div>
    </div>`;

  return `
    <section class="rr-panel card span-7">
      <div class="panel-head">
        <h3>${svg('scale')} Cost over ${esc(fmtYears(npc.horizonYears))}</h3>
        <p>Net present cost, today's dollars</p>
      </div>
      <div class="npc-bars">
        <div class="npc-row ${repairWins ? 'is-winner' : ''}">
          <div class="npc-name">Repair</div>
          <div class="npc-track"><div class="npc-fill fill-repair ${repairWins ? '' : 'is-dim'}" data-npc-fill data-pct="${(repair / max) * 100}"></div></div>
          <div class="npc-amount tnum" data-count data-to="${repair}">${fmtMoney(0)}</div>
        </div>
        <div class="npc-row ${repairWins ? '' : 'is-winner'}">
          <div class="npc-name">Replace</div>
          <div class="npc-track"><div class="npc-fill fill-replace ${repairWins ? 'is-dim' : ''}" data-npc-fill data-pct="${(replace / max) * 100}"></div></div>
          <div class="npc-amount tnum" data-count data-to="${replace}">${fmtMoney(0)}</div>
        </div>
      </div>
      <div class="npc-meta">
        <span>${beText}</span>
        <span>Discount rate <b class="tnum">${fmtPct(npc.discountRate, 1)}</b></span>
        <span>Advantage <b class="tnum">${fmtMoney(Math.abs(npc.advantageOfReplacing ?? 0))}</b> to ${repairWins ? 'repairing' : 'replacing'}</span>
      </div>
      <details class="rr-details">
        <summary>See the line-item breakdown</summary>
        <div class="breakdown">
          ${bd('Repair &amp; keep', npc.repairBreakdown || {})}
          ${bd('Replace now', npc.replaceBreakdown || {})}
        </div>
      </details>
    </section>`;
}

function rulMarkup(r) {
  const rul = r.rul || {};
  const surv = [
    { cap: '12 mo', v: rul.survival12Months },
    { cap: '24 mo', v: rul.survival24Months },
    { cap: '36 mo', v: rul.survival36Months },
  ];
  return `
    <section class="rr-panel card span-5">
      <div class="panel-head">
        <h3>${svg('clock')} Remaining useful life</h3>
        <p>Weibull survival model</p>
      </div>
      <div class="rr-stat">
        <span class="stat-value tnum" data-count data-to="${rul.medianRemainingYears ?? 0}" data-kind="years">0 yrs</span>
        <span class="stat-label">Median remaining life at this age</span>
      </div>
      <div class="survival" aria-label="Probability the unit is still working at 12, 24, and 36 months">
        ${surv
          .map(
            (s) => `<div class="survival-bar">
              <span class="bar-val">${fmtPct(s.v)}</span>
              <div class="survival-track"><div class="bar" data-bar data-pct="${Math.round((s.v ?? 0) * 100)}"></div></div>
              <span class="bar-cap">${s.cap}</span>
            </div>`,
          )
          .join('')}
      </div>
      <p class="muted" style="font-size:var(--step--1);margin-top:var(--sp-3)">
        Chance the unit is still running at each horizon. Shape β&nbsp;<b class="tnum">${(rul.shape ?? 0).toFixed(2)}</b>
        (&gt;1 = wear-out), scale η&nbsp;<b class="tnum">${(rul.scaleYears ?? 0).toFixed(1)}</b>&nbsp;yrs.
      </p>
    </section>`;
}

function repairCostMarkup(r) {
  const rc = r.repairCost || {};
  return `
    <section class="rr-panel card span-6">
      <div class="panel-head">
        <h3>${svg('wrench')} Expected repair cost</h3>
        <p>Quote vs. risk-adjusted</p>
      </div>
      <div class="quote-vs">
        <div class="rr-stat">
          <span class="stat-value tnum">${fmtMoney(rc.quote)}</span>
          <span class="stat-label">Your quote</span>
        </div>
        <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.arrow}</svg>
        <div class="rr-stat">
          <span class="stat-value tnum" data-count data-to="${rc.expected ?? 0}" data-kind="money">${fmtMoney(0)}</span>
          <span class="stat-label">Risk-adjusted expected</span>
        </div>
      </div>
      <span class="risk-chip">${svg('alert', 'callout-icon')} ${fmtPct(rc.repeatFailureProbability)} chance of another failure within 2 years</span>
      <p class="muted" style="font-size:var(--step--1);margin-top:var(--sp-3)">
        We add the modelled cost of a likely follow-on repair
        (${fmtMoney(rc.subsequentRepairCost)}) weighted by its probability, so the number
        reflects the true cost of keeping the old unit — not just today's invoice.
      </p>
    </section>`;
}

function energyMarkup(r) {
  const e = r.energy || {};
  const saves = (e.annualSavings ?? 0) >= 0;
  return `
    <section class="rr-panel card span-6">
      <div class="panel-head">
        <h3>${svg('bolt')} Energy</h3>
        <p>${e.localized ? 'Localized rates' : 'National average rates'}</p>
      </div>
      <div class="rr-stat">
        <span class="stat-value tnum" data-count data-to="${Math.abs(e.annualSavings ?? 0)}" data-kind="money">${fmtMoney(0)}</span>
        <span class="stat-label">${saves ? 'Estimated annual saving with a new unit' : 'Estimated annual cost increase with a new unit'}</span>
      </div>
      <div class="stat-pair" style="margin-top:var(--sp-4)">
        <div class="rr-stat"><span class="stat-value tnum" style="font-size:var(--step-1)">${fmtMoney(e.annualOldCost)}</span><span class="stat-label">Old unit / yr</span></div>
        <div class="rr-stat"><span class="stat-value tnum" style="font-size:var(--step-1)">${fmtMoney(e.annualNewCost)}</span><span class="stat-label">New unit / yr</span></div>
      </div>
      <div class="rate-grid">
        <div class="rate"><b class="tnum">$${(e.electricityRate ?? 0).toFixed(3)}</b><span>per kWh electricity</span></div>
        <div class="rate"><b class="tnum">$${(e.gasRate ?? 0).toFixed(2)}</b><span>per therm gas</span></div>
      </div>
      ${e.localized ? '' : '<p class="muted" style="font-size:var(--step--1);margin-top:var(--sp-3)">Add a location above for rates specific to your state.</p>'}
    </section>`;
}

function confidenceMarkup(r, wide) {
  const c = r.confidence || {};
  const level = c.level || 'moderate';
  const factors = (c.factors || []).map((f) => `<li>${esc(f)}</li>`).join('');
  return `
    <section class="rr-panel card ${wide ? 'span-12' : 'span-5'}">
      <div class="panel-head">
        <h3>${svg('gauge')} Confidence</h3>
        <p>How complete your inputs are</p>
      </div>
      <div class="conf-head">
        <span class="conf-score tnum" data-count data-to="${c.score ?? 0}" data-kind="int">0</span>
        <span class="conf-level">${esc(CONFIDENCE_LABEL[level] || level)}</span>
      </div>
      <div class="conf-meter"><div class="conf-fill" data-conf-fill data-level="${esc(level)}" data-pct="${c.score ?? 0}"></div></div>
      ${factors ? `<ul class="factor-list">${factors}</ul>` : '<p class="muted" style="font-size:var(--step--1)">All key inputs provided — nothing dragging the estimate down.</p>'}
    </section>`;
}

function safetyMarkup(r) {
  const s = r.safety || {};
  if (!(s.professionalRequired || (s.messages && s.messages.length))) return '';
  const hazardList = s.hazards || [];
  // Only gas / high-voltage / refrigerant are true safety hazards. A part that
  // is merely not homeowner-serviceable (e.g. a washer transmission) is routed
  // to a pro but must NOT trigger a red hazard alarm with no explanation.
  const dangerous = hazardList.some((h) => h === 'gas' || h === 'high_voltage' || h === 'refrigerant');
  const messages = (s.messages || []).map((m) => `<li>${esc(m)}</li>`).join('');
  const hazards = hazardList
    .map((h) => `<span class="hazard-tag">${esc(String(h).replace(/_/g, ' '))}</span>`)
    .join('');
  const calloutClass = dangerous ? 'callout-danger' : 'callout-info';
  const role = dangerous ? ' role="alert"' : '';
  const title = dangerous
    ? 'Call a licensed professional for this repair'
    : s.professionalRequired
      ? 'Professional service recommended'
      : 'Safety note';
  const diyNote = s.diySuppressed
    ? dangerous
      ? 'We’ve hidden DIY part links because this job carries a safety hazard that warrants a licensed pro.'
      : 'We’ve hidden DIY part links because this part isn’t homeowner-serviceable — there’s no safe DIY path, so it should go to a professional.'
    : '';
  return `
    <section class="rr-panel card span-7">
      <div class="callout ${calloutClass}"${role}>
        ${svg('shield', 'callout-icon')}
        <div>
          <h4>${title}</h4>
          ${messages ? `<ul>${messages}</ul>` : ''}
          ${diyNote ? `<p style="margin-top:var(--sp-2)">${diyNote}</p>` : ''}
          ${hazards ? `<div class="hazard-tags">${hazards}</div>` : ''}
        </div>
      </div>
    </section>`;
}

function recallMarkup(r) {
  const rec = r.recall || {};
  if (rec.status === 'active') {
    const matches = (rec.matches || [])
      .map(
        (m) => `<div class="recall-match">
          <div class="rm-head">
            <span class="rm-title">${esc(m.company)} — ${esc(m.productType)}</span>
            <span class="rm-num">${esc(m.recallNumber)}</span>
          </div>
          <p class="rm-hazard">${esc(m.hazard)}${m.recallDate ? ` · ${esc(m.recallDate)}` : ''}</p>
          ${(() => {
            const h = safeHref(m.url);
            return m.url && h !== '#'
              ? `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer nofollow">View CPSC notice ${svg('external', 'callout-icon')}</a>`
              : '';
          })()}
        </div>`,
      )
      .join('');
    return `
      <section class="rr-panel card span-12">
        <div class="callout callout-danger" role="alert">
          ${svg('recall', 'callout-icon')}
          <div style="width:100%">
            <h4>Open federal recall matched</h4>
            <p>Contact the manufacturer before paying for any repair — a recall remedy is usually free.</p>
            <div style="margin-top:var(--sp-3)">${matches}</div>
          </div>
        </div>
      </section>`;
  }
  const cls = rec.status === 'clear' ? 'callout-clear' : 'callout-info';
  const icon = rec.status === 'clear' ? 'check' : 'info';
  const title = rec.status === 'clear' ? 'No open recalls found' : 'Recall check unavailable';
  const note =
    rec.note ||
    (rec.status === 'clear'
      ? 'This unit did not match any active federal recall.'
      : 'Provide a UPC to check for open federal recalls.');
  return `
    <section class="rr-panel card span-12">
      <div class="callout ${cls}">
        ${svg(icon, 'callout-icon')}
        <div><h4>${esc(title)}</h4><p>${esc(note)}</p></div>
      </div>
    </section>`;
}

function provenanceMarkup(r) {
  const notes = (r.provenance || [])
    .map(
      (n) => `<li><span class="p-label">${esc(n.label)}</span><span class="p-source">${esc(n.source)}</span></li>`,
    )
    .join('');
  return `
    <section class="rr-panel card span-12">
      <details class="rr-details">
        <summary>${svg('book', 'callout-icon')} How we calculated this</summary>
        <ul class="provenance-list">${notes}</ul>
      </details>
    </section>`;
}

function monetizationMarkup(r) {
  const m = r.monetization || {};
  const links = m.affiliateLinks || [];
  const leads = m.leadGen || [];
  if (!links.length && !leads.length) {
    // Still show the disclosure-bearing shell only if there is something; here nothing.
    return '';
  }
  const partLinks = links.filter((l) => l.kind === 'part');
  const unitLinks = links.filter((l) => l.kind === 'new_unit');

  const linkEl = (l) => `
    <a class="mon-link" href="${esc(safeHref(l.url))}" target="_blank" rel="sponsored nofollow noopener noreferrer">
      <span>${esc(l.label)}<br><span class="mon-merchant">${esc(l.merchant)}</span></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.external}</svg>
    </a>`;

  const groups = [];
  if (partLinks.length) {
    groups.push(`<div class="mon-group"><h4>Parts for this repair</h4><div class="mon-links">${partLinks.map(linkEl).join('')}</div></div>`);
  }
  if (unitLinks.length) {
    groups.push(`<div class="mon-group"><h4>Shop replacement units</h4><div class="mon-links">${unitLinks.map(linkEl).join('')}</div></div>`);
  }
  if (leads.length) {
    const leadEls = leads
      .map(
        (l) => `<div class="leadgen">
          <span class="lg-label">${esc(l.label)}</span>
          <span class="lg-est">Typical local invoice: <b class="tnum">${fmtMoney(l.estimatedInvoiceLow)}–${fmtMoney(l.estimatedInvoiceHigh)}</b></span>
        </div>`,
      )
      .join('');
    groups.push(`<div class="mon-group"><h4>Get a local pro quote</h4><div class="mon-links">${leadEls}</div></div>`);
  }

  return `
    <section class="rr-monetize" aria-labelledby="mon-title">
      <div class="mon-head">
        ${svg('arrow', 'panel-icon')}
        <h3 id="mon-title">Next steps</h3>
        <span class="mon-tag">Partner links</span>
      </div>
      <p class="mon-intro">These are optional shortcuts to act on your result. They're kept separate from the analysis above and never change the verdict.</p>
      <div class="mon-groups ${groups.length > 1 ? 'has-two' : ''}">${groups.join('')}</div>
      <p class="mon-disclosure">${esc(m.disclosure || '')}</p>
    </section>`;
}

function shareMarkup(shared) {
  if (shared) {
    return `
      <section class="rr-share" style="justify-content:center;text-align:center">
        <div class="share-copy" style="flex-basis:100%">
          <h3>Viewing a shared result</h3>
          <p>Facing a repair-or-replace decision of your own? Run a free analysis in under a minute.</p>
        </div>
        <a class="btn btn-primary" href="/#calculator">Analyze my appliance ${svg('arrow', 'callout-icon')}</a>
      </section>`;
  }
  return `
    <section class="rr-share" data-share>
      <div class="share-copy">
        <h3>${svg('share', 'callout-icon')} Save or share this result</h3>
        <p>Create a private link you can revisit or send to a partner or technician.</p>
      </div>
      <button class="btn btn-primary" type="button" data-share-btn>
        <span class="btn-label">Create shareable link</span>
      </button>
      <div class="share-url" data-share-url hidden>
        <input type="text" readonly data-share-input aria-label="Shareable result link" />
        <button class="btn" type="button" data-copy-btn>Copy</button>
      </div>
    </section>`;
}

/**
 * Render the full result experience into `mount`.
 * @param {object} result CalculationResult from /api/calculate or /api/report.
 * @param {HTMLElement} mount container element.
 * @param {{shared?:boolean, animate?:boolean}} [opts]
 */
export function renderResult(result, mount, opts = {}) {
  if (!result || !mount) return;
  const shared = !!opts.shared;
  const animate = opts.animate !== false && !REDUCED_MOTION;

  const safetyPresent =
    result.safety && (result.safety.professionalRequired || (result.safety.messages || []).length > 0);

  const analysis = [
    npcMarkup(result),
    rulMarkup(result),
    repairCostMarkup(result),
    energyMarkup(result),
    confidenceMarkup(result, !safetyPresent),
    safetyMarkup(result),
    recallMarkup(result),
    provenanceMarkup(result),
  ].join('');

  mount.innerHTML = `
    <div class="rr ${animate ? 'rr-enter' : ''}">
      ${verdictMarkup(result)}
      <div class="rr-analysis">${analysis}</div>
      ${monetizationMarkup(result)}
      ${shareMarkup(shared)}
    </div>`;

  // Announce to the polite live region if present.
  const live = document.getElementById('rr-live');
  if (live) {
    const p = result.gaugePosition;
    live.textContent = `Result ready. ${result.verdictHeadline}` + (p == null ? '' : ` Gauge ${p} of 100 toward replacing.`);
  }

  runResultEffects(mount, animate);
  if (!shared) wireShare(mount, result);
}

function runResultEffects(mount, animate) {
  // Gauge needle sweep.
  const needle = mount.querySelector('[data-gauge-needle]');
  if (needle) {
    const pos = Math.min(100, Math.max(0, Number(needle.dataset.pos) || 50));
    const target = -90 + (pos / 100) * 180;
    if (animate) {
      const start = performance.now();
      const dur = 900;
      const from = -90;
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        const angle = from + (target - from) * eased;
        needle.setAttribute('transform', `rotate(${angle.toFixed(2)} 160 168)`);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } else {
      needle.setAttribute('transform', `rotate(${target} 160 168)`);
    }
  }

  // NPC + survival + confidence fills (grow after paint).
  const grow = () => {
    mount.querySelectorAll('[data-npc-fill]').forEach((el) => {
      el.style.width = `${Math.max(2, Number(el.dataset.pct) || 0)}%`;
    });
    mount.querySelectorAll('[data-bar]').forEach((el) => {
      el.style.height = `${Math.max(2, Number(el.dataset.pct) || 0)}%`;
    });
    mount.querySelectorAll('[data-conf-fill]').forEach((el) => {
      el.style.width = `${Math.min(100, Math.max(0, Number(el.dataset.pct) || 0))}%`;
    });
  };
  if (animate) requestAnimationFrame(() => requestAnimationFrame(grow));
  else grow();

  // Count-up numbers.
  mount.querySelectorAll('[data-count]').forEach((el) => {
    const to = Number(el.dataset.to) || 0;
    const kind = el.dataset.kind || 'money';
    let render;
    if (kind === 'years') render = (v) => fmtYears(v);
    else if (kind === 'int') render = (v) => String(Math.round(v));
    else render = (v) => fmtMoney(v);
    if (animate) countUp(el, to, render);
    else el.textContent = render(to);
  });
}

function wireShare(mount, result) {
  const btn = mount.querySelector('[data-share-btn]');
  if (!btn) return;
  const urlBox = mount.querySelector('[data-share-url]');
  const input = mount.querySelector('[data-share-input]');
  const copyBtn = mount.querySelector('[data-copy-btn]');
  const label = btn.querySelector('.btn-label');

  btn.addEventListener('click', async () => {
    if (input && input.value) {
      urlBox.hidden = false;
      input.select();
      return;
    }
    btn.disabled = true;
    const prev = label.textContent;
    label.textContent = 'Creating…';
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      const full = new URL(data.url, location.origin).href;
      input.value = full;
      urlBox.hidden = false;
      input.focus();
      input.select();
      label.textContent = 'Link ready';
    } catch (err) {
      label.textContent = 'Try again';
      btn.disabled = false;
      console.error('Share failed:', err);
      return;
    }
    btn.disabled = false;
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!input.value) return;
      try {
        await navigator.clipboard.writeText(input.value);
      } catch {
        input.select();
        try {
          document.execCommand('copy');
        } catch {}
      }
      const t = copyBtn.textContent;
      copyBtn.textContent = 'Copied ✓';
      copyBtn.classList.add('copy-ok');
      setTimeout(() => {
        copyBtn.textContent = t;
        copyBtn.classList.remove('copy-ok');
      }, 1800);
    });
  }
}

/* --------------------------------------------------------------------------
   Shared state renderers (loading / error) — reused by r.html
   -------------------------------------------------------------------------- */

export function renderLoading(mount) {
  if (!mount) return;
  mount.innerHTML = `
    <div class="rr">
      <div class="rr-skeleton" aria-hidden="true">
        <div class="skel skel-verdict"></div>
        <div class="skel-grid">
          <div class="skel skel-row"></div>
          <div class="skel skel-row"></div>
        </div>
      </div>
      <p class="sr-only" role="status">Calculating your result…</p>
    </div>`;
}

export function renderError(mount, message, opts = {}) {
  if (!mount) return;
  mount.innerHTML = `
    <div class="rr">
      <section class="rr-panel card">
        <div class="rr-state" role="alert">
          <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.alert}</svg>
          <h3>${esc(opts.title || 'Something went wrong')}</h3>
          <p>${esc(message || 'Please try again in a moment.')}</p>
          ${opts.cta ? `<a class="btn btn-primary" href="${esc(opts.cta.href)}" style="margin-top:var(--sp-3)">${esc(opts.cta.label)}</a>` : ''}
        </div>
      </section>
    </div>`;
}

/* --------------------------------------------------------------------------
   Homepage calculator (form build + submit) — runs only when #intake-form exists
   -------------------------------------------------------------------------- */

function el(tag, attrs = {}, html) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  if (html != null) node.innerHTML = html;
  return node;
}

function buildForm(form, catalog) {
  const categories = catalog.categories || [];
  const tiers = catalog.tiers || [];
  const metros = catalog.metros || [];

  const categoryOptions = categories
    .map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`)
    .join('');

  const tierSegments = tiers
    .map(
      (t, i) => `<label>${esc(t.label)}
        <input type="radio" name="brandTier" value="${esc(t.id)}" ${t.id === 'mid' || (i === 0 && !tiers.some((x) => x.id === 'mid')) ? 'checked' : ''}>
      </label>`,
    )
    .join('');

  const metroOptions =
    '<option value="">Choose your metro…</option>' +
    metros.map((m) => `<option value="${esc(m.slug)}">${esc(m.name)}</option>`).join('');

  form.innerHTML = `
    <div class="calc-grid">
      <div class="field col-span">
        <label for="f-category">Appliance</label>
        <select id="f-category" name="category" required>${categoryOptions}</select>
      </div>

      <div class="field col-span">
        <span class="label" id="f-tier-label">Brand tier</span>
        <div class="segment segment-block" role="radiogroup" aria-labelledby="f-tier-label">${tierSegments}</div>
        <span class="hint">Lifespan and new-unit price are keyed to build quality — not a single category average.</span>
      </div>

      <div class="field">
        <label for="f-age">Age (years)</label>
        <input id="f-age" name="ageYears" type="number" min="0" max="60" step="1" value="8" inputmode="numeric">
        <span class="hint">Roughly how old is it?</span>
      </div>

      <div class="field">
        <label for="f-quote">Repair quote <span class="req" aria-hidden="true">*</span></label>
        <div class="input-affix"><span class="affix">$</span>
          <input id="f-quote" name="repairQuote" type="number" min="0" step="1" inputmode="decimal" required placeholder="0" aria-describedby="f-quote-err">
        </div>
        <span class="field-error" id="f-quote-err">Enter the technician's quote (a number above $0).</span>
      </div>

      <div class="field col-span">
        <label for="f-component">Failed part or symptom</label>
        <select id="f-component" name="faultComponent"></select>
        <span class="hint">Not sure? Pick “I'm not sure” — we'll use a category-wide estimate and note the lower confidence.</span>
      </div>

      <div class="field col-span" data-fuel-field hidden>
        <span class="label" id="f-fuel-label">Fuel type</span>
        <div class="segment segment-block" role="radiogroup" aria-labelledby="f-fuel-label" data-fuel-seg></div>
      </div>

      <div class="field col-span">
        <div class="field-row">
          <label for="f-metro" id="f-loc-label">Location</label>
          <div class="loc-switch" role="group" aria-label="Choose location input">
            <button type="button" data-loc="metro" aria-pressed="true">Metro</button>
            <button type="button" data-loc="zip" aria-pressed="false">ZIP</button>
          </div>
        </div>
        <select id="f-metro" name="metro" class="loc-input" data-loc-input="metro" aria-labelledby="f-loc-label">${metroOptions}</select>
        <input id="f-zip" name="zip" class="loc-input" data-loc-input="zip" type="text" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" placeholder="ZIP code (5 digits)" aria-labelledby="f-loc-label" hidden>
        <span class="hint">Optional — localizes labor and energy rates. Skipping uses national averages.</span>
      </div>
    </div>

    <div class="toggle-row" style="margin-top:var(--sp-5)">
      <label class="switch">
        <input type="checkbox" name="underWarranty">
        <span class="switch-track"><span class="switch-thumb"></span></span>
        <span class="switch-text"><b>Still under warranty?</b><span>Covered repairs usually win.</span></span>
      </label>
      <label class="switch">
        <input type="checkbox" name="energyStarReplacement" checked>
        <span class="switch-track"><span class="switch-thumb"></span></span>
        <span class="switch-text"><b>Replace with ENERGY&nbsp;STAR?</b><span>Models the efficiency gain.</span></span>
      </label>
    </div>

    <details class="calc-advanced">
      <summary>Advanced — recall check</summary>
      <div class="field">
        <label for="f-upc">UPC / barcode (optional)</label>
        <input id="f-upc" name="upc" type="text" inputmode="numeric" placeholder="e.g. 883049370668" autocomplete="off">
        <span class="hint">We'll check the CPSC federal recall database for this exact unit.</span>
      </div>
    </details>

    <div class="calc-actions">
      <button class="btn btn-primary btn-lg btn-block calc-submit" type="submit">
        <span class="btn-label">Get my verdict</span>
      </button>
      <p class="calc-legal">Free · No sign-up · Estimates only, not a technical diagnosis.</p>
    </div>
  `;

  return {
    categoryEl: form.querySelector('#f-category'),
    componentEl: form.querySelector('#f-component'),
    fuelField: form.querySelector('[data-fuel-field]'),
    fuelSeg: form.querySelector('[data-fuel-seg]'),
  };
}

function populateComponents(componentEl, category) {
  const comps = (category && category.components) || [];
  componentEl.innerHTML =
    comps.map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('') +
    '<option value="">I’m not sure</option>';
  // Default to "not sure" so we never imply false precision.
  componentEl.value = '';
}

function populateFuel(fuelField, fuelSeg, category) {
  if (!category || !category.fuelDependent) {
    fuelField.hidden = true;
    fuelSeg.innerHTML = '';
    return;
  }
  fuelField.hidden = false;
  const def = category.defaultFuel || 'electric';
  fuelSeg.innerHTML = ['gas', 'electric']
    .map(
      (f) => `<label>${f === 'gas' ? 'Gas' : 'Electric'}
        <input type="radio" name="fuelType" value="${f}" ${f === def ? 'checked' : ''}>
      </label>`,
    )
    .join('');
}

function serialize(form, catalogById) {
  const fd = new FormData(form);
  const category = fd.get('category');
  const input = {
    category,
    brandTier: fd.get('brandTier') || 'mid',
    ageYears: Number(fd.get('ageYears') || 0),
    repairQuote: Number(fd.get('repairQuote') || 0),
    underWarranty: fd.get('underWarranty') === 'on',
    energyStarReplacement: fd.get('energyStarReplacement') === 'on',
  };

  const comp = fd.get('faultComponent');
  if (comp) input.faultComponent = comp;

  const cat = catalogById[category];
  if (cat && cat.fuelDependent) {
    const fuel = fd.get('fuelType');
    if (fuel) input.fuelType = fuel;
  }

  const mode = form.dataset.locMode || 'metro';
  if (mode === 'metro') {
    const metro = fd.get('metro');
    if (metro) input.location = { metro };
  } else {
    const zip = (fd.get('zip') || '').trim();
    if (zip) input.location = { zip };
  }

  const upc = (fd.get('upc') || '').trim();
  if (upc) input.upc = upc;

  return input;
}

function validate(form) {
  let ok = true;
  const quoteField = form.querySelector('#f-quote').closest('.field');
  const quote = Number(form.querySelector('#f-quote').value);
  if (!(quote > 0)) {
    quoteField.dataset.invalid = 'true';
    form.querySelector('#f-quote').setAttribute('aria-invalid', 'true');
    ok = false;
  } else {
    delete quoteField.dataset.invalid;
    form.querySelector('#f-quote').removeAttribute('aria-invalid');
  }
  return ok;
}

function initCalculator() {
  const form = document.getElementById('intake-form');
  if (!form) return;
  const region = document.getElementById('result-region');
  const mount = document.getElementById('result-mount');

  const catalogById = {};

  fetch('/api/catalog')
    .then((r) => {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then((catalog) => {
      (catalog.categories || []).forEach((c) => {
        catalogById[c.id] = c;
      });
      const refs = buildForm(form, catalog);

      const syncCategory = () => {
        const cat = catalogById[refs.categoryEl.value];
        populateComponents(refs.componentEl, cat);
        populateFuel(refs.fuelField, refs.fuelSeg, cat);
      };
      refs.categoryEl.addEventListener('change', syncCategory);
      syncCategory();

      // Location metro/zip switch.
      form.dataset.locMode = 'metro';
      form.querySelectorAll('[data-loc]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.loc;
          form.dataset.locMode = mode;
          form.querySelectorAll('[data-loc]').forEach((b) =>
            b.setAttribute('aria-pressed', String(b.dataset.loc === mode)),
          );
          form.querySelectorAll('[data-loc-input]').forEach((inp) => {
            inp.hidden = inp.dataset.locInput !== mode;
          });
        });
      });

      // Clear validation as the user fixes the quote.
      form.querySelector('#f-quote').addEventListener('input', () => validate(form));

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate(form)) {
          const bad = form.querySelector('[data-invalid="true"] input');
          if (bad) bad.focus();
          return;
        }
        submit();
      });

      async function submit() {
        const input = serialize(form, catalogById);
        const btn = form.querySelector('.calc-submit');
        const label = btn.querySelector('.btn-label');
        btn.disabled = true;
        btn.classList.add('is-busy');
        label.innerHTML = '<span class="spinner" aria-hidden="true"></span> Calculating…';

        region.hidden = false;
        renderLoading(mount);
        if (!REDUCED_MOTION) region.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
          const res = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data && data.error ? data.error : 'Calculation failed');
          renderResult(data, mount, { animate: true });
        } catch (err) {
          renderError(mount, (err && err.message) || 'We couldn’t compute a result. Please check your inputs and try again.', {
            title: 'Calculation failed',
          });
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.classList.remove('is-busy');
          label.textContent = 'Recalculate';
        }
      }
    })
    .catch((err) => {
      console.error('Failed to load catalog:', err);
      form.innerHTML =
        '<div class="rr-state" role="alert"><h3>Couldn’t load the calculator</h3><p class="muted">Please refresh the page to try again.</p></div>';
    });
}

/* --------------------------------------------------------------------------
   Scroll reveal (homepage) — progressive enhancement
   -------------------------------------------------------------------------- */
function initReveal() {
  const els = document.querySelectorAll('.ro-reveal');
  if (!els.length) return;
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((e) => io.observe(e));
}

/* --------------------------------------------------------------------------
   Bootstrap (homepage only)
   -------------------------------------------------------------------------- */
function boot() {
  initCalculator();
  initReveal();
}

if (document.getElementById('intake-form')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
