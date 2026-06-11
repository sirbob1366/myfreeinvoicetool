// Generates the calculator pages from one shell.
// Run: node tools/gen-calcs.mjs   (importing gen-pages.mjs also refreshes the
// engine-family pages — both generators stay in sync.)

import { writeFileSync, mkdirSync } from 'node:fs';
import { NAV, FOOTER } from './gen-pages.mjs';

const SITE = 'https://myfreeinvoicetool.com';

function faqJsonLd(faq) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
    })),
  }, null, 1);
}

function pageHTML(p) {
  const faqDom = p.faq.map(({ q, a }) => `      <details>
        <summary>${q}</summary>
        <p>${a}</p>
      </details>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${SITE}/${p.dir}/">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${SITE}/${p.dir}/">
<meta property="og:type" content="website">
<meta name="theme-color" content="#faf8f4">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/calc.css">
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'WebApplication',
  name: `MyFreeInvoiceTool ${p.h1}`, url: `${SITE}/${p.dir}/`,
  applicationCategory: 'FinanceApplication', operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: p.features,
}, null, 1)}
</script>
<script type="application/ld+json">
${faqJsonLd(p.faq)}
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D5S8JJ385E"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-D5S8JJ385E');</script>
</head>
<body>
${NAV}

<div class="calc-shell">
  <h1 class="gen-h1" style="font-size:clamp(26px,3vw,34px);margin:22px 0 4px">${p.h1}</h1>
  <p class="gen-sub" style="color:var(--muted);margin-bottom:18px">${p.sub}</p>

  <div class="calc-card">
${p.form}
  </div>
</div>

<section class="section">
  <div class="wrap copy">
    <div class="trustline" style="margin-bottom:34px">
      <span>Instant — no page reloads</span><span>No account</span><span>Works offline</span><span>Nothing uploaded</span>
    </div>
${p.copy}
    <h2 id="faq">Frequently asked questions</h2>
    <div class="faq">
${faqDom}
    </div>
  </div>
</section>
${FOOTER}

<script type="module">
${p.script}
</script>
<script type="module" src="/assets/js/pwa.js"></script>
</body>
</html>
`;
}

// Shared script helpers injected into every calculator.
const HELPERS = `
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fmt = (n, d = 2) => (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtIN = (n, d = 2) => (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const num = (s) => { const v = parseFloat($(s).value); return Number.isFinite(v) ? v : 0; };
function seg(sel, onChange) {
  const root = $(sel);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$(sel + ' button').forEach((x) => x.classList.toggle('active', x === b));
    onChange(b.dataset.v);
  });
  return () => root.querySelector('.active').dataset.v;
}
function bindAll(onInput) {
  $$('input, select').forEach((el) => el.addEventListener('input', onInput));
}
`;

const CALCS = [
  // ------------------------------------------------ GST
  {
    dir: 'gst-calculator',
    title: 'GST Calculator — Inclusive & Exclusive, CGST/SGST Split | MyFreeInvoiceTool',
    desc: 'Free Indian GST calculator: add GST to a base amount or extract it from an inclusive price, at 5%, 12%, 18% or 28%, with the CGST/SGST split shown. Instant, private, offline-capable.',
    h1: 'GST calculator',
    sub: 'Add GST to a price or pull it out of an inclusive amount — with the CGST/SGST split, at any rate.',
    features: 'GST inclusive and exclusive calculation, 5/12/18/28 rate chips, CGST SGST split, Indian number formatting',
    form: `
    <div class="calc-grid">
      <div>
        <label for="amount">Amount (₹)</label>
        <input id="amount" type="number" min="0" step="any" placeholder="10,000" autofocus>
      </div>
      <div>
        <label>Mode</label>
        <div class="seg" id="mode">
          <button type="button" class="active" data-v="excl">Add GST (exclusive)</button>
          <button type="button" data-v="incl">Remove GST (inclusive)</button>
        </div>
      </div>
    </div>
    <div style="margin-top:14px">
      <label>GST rate</label>
      <div class="chips" id="rates">
        <button type="button" class="chip" data-r="5">5%</button>
        <button type="button" class="chip" data-r="12">12%</button>
        <button type="button" class="chip active" data-r="18">18%</button>
        <button type="button" class="chip" data-r="28">28%</button>
        <input id="custom-rate" type="number" min="0" max="100" step="any" placeholder="Custom %" style="width:110px">
      </div>
    </div>
    <div class="calc-results">
      <div class="result"><small>Taxable value</small><strong id="r-base">₹0.00</strong></div>
      <div class="result"><small>CGST</small><strong id="r-cgst">₹0.00</strong></div>
      <div class="result"><small>SGST</small><strong id="r-sgst">₹0.00</strong></div>
      <div class="result"><small>Total GST</small><strong id="r-gst">₹0.00</strong></div>
      <div class="result accent"><small>Total</small><strong id="r-total">₹0.00</strong></div>
    </div>
    <p class="muted" style="font-size:12.5px;margin:14px 0 0">Intra-state supplies split the GST equally into CGST + SGST; inter-state supplies charge the same total as IGST. Make a compliant invoice with the <a href="/gst-invoice/">GST invoice generator</a>.</p>`,
    script: `${HELPERS}
let rate = 18;
const getMode = seg('#mode', calc);
$$('#rates .chip').forEach((c) => c.addEventListener('click', () => {
  $$('#rates .chip').forEach((x) => x.classList.remove('active'));
  c.classList.add('active');
  $('#custom-rate').value = '';
  rate = +c.dataset.r;
  calc();
}));
$('#custom-rate').addEventListener('input', () => {
  $$('#rates .chip').forEach((x) => x.classList.remove('active'));
  rate = num('#custom-rate');
  calc();
});
function calc() {
  const amt = num('#amount');
  const mode = getMode();
  const base = mode === 'incl' ? amt / (1 + rate / 100) : amt;
  const gst = base * rate / 100;
  $('#r-base').textContent = '₹' + fmtIN(base);
  $('#r-cgst').textContent = '₹' + fmtIN(gst / 2);
  $('#r-sgst').textContent = '₹' + fmtIN(gst / 2);
  $('#r-gst').textContent = '₹' + fmtIN(gst);
  $('#r-total').textContent = '₹' + fmtIN(base + gst);
}
bindAll(calc);
calc();`,
    copy: `
    <h2>How GST is calculated</h2>
    <p>India's Goods and Services Tax is charged as a percentage of the <em>taxable value</em> — the price before tax. The standard rate slabs are <strong>5%, 12%, 18% and 28%</strong>, with special rates of 0.25% (rough precious stones) and 3% (gold and jewellery), and a nil slab for essentials. The arithmetic runs in two directions, and mixing them up is the most common GST mistake:</p>
    <ul>
      <li><strong>Exclusive (adding GST):</strong> GST = price × rate ÷ 100. A ₹10,000 service at 18% carries ₹1,800 of GST, invoicing at ₹11,800.</li>
      <li><strong>Inclusive (extracting GST):</strong> when a price already contains GST, the tax is <em>not</em> 18% of the sticker price. Taxable value = price ÷ (1 + rate/100). From ₹11,800 inclusive at 18%: base ₹10,000, GST ₹1,800 — not ₹2,124.</li>
    </ul>
    <h2>CGST, SGST and IGST — where the split comes from</h2>
    <p>GST is a dual levy. On a supply <strong>within one state</strong>, the rate is divided equally between Central GST and State GST — an 18% supply shows as CGST 9% + SGST 9% on the invoice. On a supply <strong>between states</strong>, the whole amount is charged as Integrated GST (IGST 18%). The totals are identical; only the split — and which government collects — changes. This calculator shows the intra-state split; the <a href="/gst-invoice/">GST invoice generator</a> applies the correct treatment automatically from your state and the place of supply.</p>
    <h2>Rounding</h2>
    <p>GST law provides for rounding the tax to the nearest rupee on invoices (Section 170, normal rounding). This calculator shows paise-level precision so you can see the exact arithmetic; invoices commonly round each tax line.</p>
    <h2>Worked example</h2>
    <p>A designer in Maharashtra bills a Karnataka client ₹50,000 for brand work at 18%. Inter-state → IGST ₹9,000, invoice total ₹59,000. The same project for a Mumbai client would show CGST ₹4,500 + SGST ₹4,500 — same ₹59,000 total.</p>`,
    faq: [
      { q: 'How do I calculate GST from an inclusive price?', a: 'Divide the inclusive price by (1 + rate/100) to get the taxable value; the difference is the GST. ₹11,800 at 18% → ₹10,000 base + ₹1,800 GST. Use the “Remove GST” mode above.' },
      { q: 'What are the GST rate slabs?', a: 'The main slabs are 5%, 12%, 18% and 28%, plus 0% for many essentials, 0.25% for rough precious stones and 3% for gold. Most services fall under 18%.' },
      { q: 'When is GST split into CGST and SGST?', a: 'For supplies within one state. The rate is halved between the central and state governments. Inter-state supplies charge the full rate as IGST instead.' },
      { q: 'Is this calculator exact for invoicing?', a: 'Yes — it uses the same arithmetic as our GST invoice generator. For the invoice itself (with GSTIN, HSN/SAC and the automatic split), use the GST invoice tool.' },
    ],
  },

  // ------------------------------------------------ VAT
  {
    dir: 'vat-calculator',
    title: 'VAT Calculator — Add or Remove VAT at Any Rate | MyFreeInvoiceTool',
    desc: 'Free VAT calculator: add VAT to a net price or extract it from a gross amount at any rate (20%, 19%, 5%…). Instant, accurate, private — nothing leaves your browser.',
    h1: 'VAT calculator',
    sub: 'Net to gross, gross to net — at any VAT rate, instantly.',
    features: 'Add VAT, remove VAT, net and gross calculation, any rate',
    form: `
    <div class="calc-grid">
      <div>
        <label for="amount">Amount</label>
        <input id="amount" type="number" min="0" step="any" placeholder="1,000" autofocus>
      </div>
      <div>
        <label for="rate">VAT rate %</label>
        <input id="rate" type="number" min="0" max="100" step="any" value="20">
      </div>
    </div>
    <div style="margin-top:14px">
      <label>Mode</label>
      <div class="seg" id="mode">
        <button type="button" class="active" data-v="add">Add VAT (net → gross)</button>
        <button type="button" data-v="remove">Remove VAT (gross → net)</button>
      </div>
    </div>
    <div class="calc-results">
      <div class="result"><small>Net amount</small><strong id="r-net">0.00</strong></div>
      <div class="result"><small>VAT</small><strong id="r-vat">0.00</strong></div>
      <div class="result accent"><small>Gross amount</small><strong id="r-gross">0.00</strong></div>
    </div>`,
    script: `${HELPERS}
const getMode = seg('#mode', calc);
function calc() {
  const amt = num('#amount');
  const rate = num('#rate');
  const net = getMode() === 'remove' ? amt / (1 + rate / 100) : amt;
  const vat = net * rate / 100;
  $('#r-net').textContent = fmt(net);
  $('#r-vat').textContent = fmt(vat);
  $('#r-gross').textContent = fmt(net + vat);
}
bindAll(calc);
calc();`,
    copy: `
    <h2>How VAT works</h2>
    <p>Value Added Tax is charged as a percentage of the net (tax-exclusive) price. The seller collects it and remits it; registered businesses reclaim the VAT they pay on inputs, so the tax ultimately lands on the final consumer. Two directions of arithmetic cover almost every situation:</p>
    <ul>
      <li><strong>Adding VAT:</strong> gross = net × (1 + rate/100). A £1,000 service at 20% bills at £1,200.</li>
      <li><strong>Removing VAT:</strong> net = gross ÷ (1 + rate/100). The error to avoid: 20% VAT is <em>not</em> 20% of the gross. From £1,200 gross, the VAT is £200 (a sixth of the gross at 20%) — not £240.</li>
    </ul>
    <h2>Common rates around the world</h2>
    <p>The UK standard rate is 20% (reduced 5%, zero 0%). EU standard rates range from 17% (Luxembourg) to 27% (Hungary), with Germany at 19% and France at 20%. The UAE and Saudi Arabia charge 5% and 15% respectively. South Africa charges 15%. Many countries operate reduced rates for food, books, transport and energy — always check which rate your supply falls under, because applying the standard rate to a reduced-rate supply is a real (and common) overcharge.</p>
    <h2>The quick mental shortcuts</h2>
    <p>At 20%, the VAT inside a gross price is the gross divided by 6. At 5%, divide the gross by 21. These fall straight out of the remove-VAT formula and are handy for receipt-checking; the calculator above does the precise version at any rate.</p>
    <h2>Invoicing with VAT</h2>
    <p>A VAT invoice must show the net amount, the rate, the VAT amount and the gross, along with your VAT registration number. The <a href="/invoice/">invoice generator</a> handles this — set the tax name to “VAT”, your rate, and add your registration number as the tax ID; the totals block renders net, VAT and gross exactly as computed here.</p>`,
    faq: [
      { q: 'How do I take VAT off a gross price?', a: 'Divide by (1 + rate/100). £120 at 20% → £100 net, £20 VAT. Never multiply the gross by the rate — that overstates the tax.' },
      { q: 'What is the UK VAT rate?', a: 'The standard rate is 20%, with a 5% reduced rate (e.g. domestic energy) and 0% zero rate (most food, books, children’s clothes).' },
      { q: 'What must appear on a VAT invoice?', a: 'Your VAT number, the net amount, the rate applied, the VAT amount and the gross total — per line or per rate. Our invoice generator includes all of these fields.' },
      { q: 'Is this calculator stored or tracked?', a: 'No — it runs entirely in your browser and works offline. Nothing you type is sent anywhere.' },
    ],
  },

  // ------------------------------------------------ Sales tax
  {
    dir: 'sales-tax-calculator',
    title: 'Sales Tax Calculator — Add or Back Out Sales Tax | MyFreeInvoiceTool',
    desc: 'Free sales tax calculator: add sales tax to a price or back it out of a total, at any combined state and local rate. Instant and private.',
    h1: 'Sales tax calculator',
    sub: 'Price before tax, tax, and total — forwards or backwards, at any combined rate.',
    features: 'Add sales tax, reverse sales tax, combined state and local rates',
    form: `
    <div class="calc-grid">
      <div>
        <label for="amount">Amount ($)</label>
        <input id="amount" type="number" min="0" step="any" placeholder="100" autofocus>
      </div>
      <div>
        <label for="rate">Sales tax rate %</label>
        <input id="rate" type="number" min="0" max="50" step="any" value="8.25">
      </div>
    </div>
    <div style="margin-top:14px">
      <label>Mode</label>
      <div class="seg" id="mode">
        <button type="button" class="active" data-v="add">Add tax (price → total)</button>
        <button type="button" data-v="remove">Back out tax (total → price)</button>
      </div>
    </div>
    <div class="calc-results">
      <div class="result"><small>Price before tax</small><strong id="r-net">$0.00</strong></div>
      <div class="result"><small>Sales tax</small><strong id="r-tax">$0.00</strong></div>
      <div class="result accent"><small>Total</small><strong id="r-total">$0.00</strong></div>
    </div>`,
    script: `${HELPERS}
const getMode = seg('#mode', calc);
function calc() {
  const amt = num('#amount');
  const rate = num('#rate');
  const net = getMode() === 'remove' ? amt / (1 + rate / 100) : amt;
  const tax = net * rate / 100;
  $('#r-net').textContent = '$' + fmt(net);
  $('#r-tax').textContent = '$' + fmt(tax);
  $('#r-total').textContent = '$' + fmt(net + tax);
}
bindAll(calc);
calc();`,
    copy: `
    <h2>How US sales tax differs from VAT</h2>
    <p>Sales tax is charged once, at the final retail sale, as a percentage of the selling price — unlike VAT, there is no input-credit chain. The rate you charge is the <strong>combined</strong> rate at the point of sale: a state base rate plus county, city and special-district add-ons. That is why “the sales tax rate” in one city can be 6% and 10.25% a few miles away. Five states (Alaska, Delaware, Montana, New Hampshire, Oregon) levy no state sales tax at all, though some Alaskan localities charge their own.</p>
    <h2>Adding tax vs backing it out</h2>
    <ul>
      <li><strong>Forward:</strong> total = price × (1 + rate/100). $100 at 8.25% → $108.25.</li>
      <li><strong>Reverse:</strong> price = total ÷ (1 + rate/100). From a $108.25 receipt at 8.25%: price $100.00, tax $8.25. Useful when a customer pays a tax-inclusive amount and you must report the taxable sale.</li>
    </ul>
    <h2>For freelancers and small sellers</h2>
    <p>Whether you must collect sales tax depends on <em>nexus</em> — a sufficient connection to a state, created by physical presence or by crossing economic thresholds (commonly $100,000 in sales into the state, following the <em>Wayfair</em> decision). Most US states do not tax most professional services, but many tax digital goods and some tax specific services — classification matters more than arithmetic. When you do charge it, show the tax as its own line: the <a href="/invoice/">invoice generator</a> lets you name the tax (“Sales Tax”), set your combined rate, and prints price, tax and total separately.</p>
    <h2>Worked example</h2>
    <p>A photographer in Austin (8.25% combined) sells prints for $400. Tax $33.00, total $433.00. If a client hands over a flat $500 “including tax”, the reverse mode shows the taxable sale as $461.89 and the tax as $38.11 — the numbers that go on the return.</p>`,
    faq: [
      { q: 'How do I back sales tax out of a total?', a: 'Divide the total by (1 + rate/100) to get the pre-tax price; the remainder is the tax. Use the “Back out tax” mode above.' },
      { q: 'What rate should I charge?', a: 'The combined state + local rate at the point of sale (or the destination, for remote sales into most states). Look up the exact locality — rates vary block by block in some metros.' },
      { q: 'Do freelancers charge sales tax on services?', a: 'In most states, most professional services are not taxable — but digital products often are, and a few states tax broad service categories. Check your state’s rules for your specific offering.' },
      { q: 'Which states have no sales tax?', a: 'Alaska, Delaware, Montana, New Hampshire and Oregon have no statewide sales tax (local taxes can still apply in Alaska).' },
    ],
  },

  // ------------------------------------------------ Late fee
  {
    dir: 'late-fee-calculator',
    title: 'Late Fee Calculator — Flat, Percentage or Monthly Interest on Overdue Invoices | MyFreeInvoiceTool',
    desc: 'Calculate late fees on overdue invoices: flat fee, one-time percentage, or monthly interest pro-rated by days overdue — plus a ready-to-paste demand line for your reminder email.',
    h1: 'Late fee calculator',
    sub: 'Days overdue, the fee your terms allow, and a demand line you can paste straight into a reminder.',
    features: 'Late fee calculation, flat fee, percentage fee, monthly interest pro-rated daily, demand note line',
    form: `
    <div class="calc-grid">
      <div>
        <label for="amount">Invoice amount</label>
        <input id="amount" type="number" min="0" step="any" placeholder="1,500" autofocus>
      </div>
      <div>
        <label for="invno">Invoice number <span class="muted">(for the demand line)</span></label>
        <input id="invno" placeholder="INV-042">
      </div>
      <div>
        <label for="due">Due date</label>
        <input id="due" type="date">
      </div>
      <div>
        <label for="asof">As of</label>
        <input id="asof" type="date">
      </div>
    </div>
    <div style="margin-top:14px">
      <label>Fee type</label>
      <div class="seg" id="mode">
        <button type="button" data-v="flat">Flat fee</button>
        <button type="button" data-v="pct">% of invoice (one-time)</button>
        <button type="button" class="active" data-v="monthly">Monthly interest %</button>
      </div>
    </div>
    <div class="calc-grid" style="margin-top:14px">
      <div>
        <label for="feeval">Fee value <span class="muted" id="feeval-hint">(% per month)</span></label>
        <input id="feeval" type="number" min="0" step="any" value="1.5">
      </div>
    </div>
    <div class="calc-results">
      <div class="result"><small>Days overdue</small><strong id="r-days">0</strong></div>
      <div class="result"><small>Late fee</small><strong id="r-fee">0.00</strong></div>
      <div class="result accent"><small>Total now due</small><strong id="r-total">0.00</strong></div>
    </div>
    <div class="copy-line">
      <textarea id="demand" rows="3" readonly aria-label="Demand note line"></textarea>
      <button id="copy-demand" type="button" class="btn btn-primary btn-sm">Copy</button>
    </div>`,
    script: `${HELPERS}
$('#due').value = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
$('#asof').value = new Date().toISOString().slice(0, 10);
const getMode = seg('#mode', () => { hint(); calc(); });
function hint() {
  const m = getMode();
  $('#feeval-hint').textContent = m === 'flat' ? '(amount)' : m === 'pct' ? '(% of invoice)' : '(% per month)';
}
function calc() {
  const amt = num('#amount');
  const feeval = num('#feeval');
  const due = new Date($('#due').value);
  const asof = new Date($('#asof').value);
  const days = Math.max(0, Math.floor((asof - due) / 864e5));
  const m = getMode();
  let fee = 0;
  if (days > 0) {
    if (m === 'flat') fee = feeval;
    else if (m === 'pct') fee = amt * feeval / 100;
    else fee = amt * (feeval / 100) * (days / 30);
  }
  $('#r-days').textContent = days;
  $('#r-fee').textContent = fmt(fee);
  $('#r-total').textContent = fmt(amt + fee);
  const inv = $('#invno').value || 'this invoice';
  const terms = m === 'flat' ? 'a flat late fee of ' + fmt(feeval) : m === 'pct' ? 'a late fee of ' + feeval + '% of the invoice value' : 'interest of ' + feeval + '% per month, pro-rated daily';
  $('#demand').value = days > 0
    ? 'Invoice ' + inv + ' for ' + fmt(amt) + ' was due on ' + $('#due').value + ' and is now ' + days + ' days overdue. Per our payment terms, ' + terms + ' has been applied (' + fmt(fee) + '), bringing the total now due to ' + fmt(amt + fee) + '.'
    : 'Invoice ' + inv + ' for ' + fmt(amt) + ' is due on ' + $('#due').value + '.';
}
$('#copy-demand').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('#demand').value);
  $('#copy-demand').textContent = 'Copied!';
  setTimeout(() => { $('#copy-demand').textContent = 'Copy'; }, 1500);
});
bindAll(calc);
hint();
calc();`,
    copy: `
    <h2>The three ways late fees are charged</h2>
    <ul>
      <li><strong>Flat fee</strong> — a fixed amount once the due date passes (“$25 late fee after Net 30”). Simple and common on small invoices.</li>
      <li><strong>One-time percentage</strong> — a single charge proportional to the invoice (“5% after 14 days late”). Scales with the debt, doesn't grow with time.</li>
      <li><strong>Monthly interest</strong> — the professional standard: “1.5% per month on overdue balances” (18% a year), pro-rated by days. This calculator pro-rates daily: fee = amount × monthly rate × days/30.</li>
    </ul>
    <h2>What's typical — and what's enforceable</h2>
    <p>Across freelancing and B2B services, <strong>1%–2% per month</strong> is the customary band; many jurisdictions also provide a statutory fallback. In the EU, the Late Payment Directive entitles businesses to reference-rate-plus-8% interest and a €40 minimum recovery cost on commercial debts. In the UK, statutory interest is 8% above the Bank of England base rate. In the US, state usury caps can limit contractual rates. The universal rule: a late fee is only enforceable if it was <em>agreed before the work</em> — which means it must appear on your invoice or contract terms, not for the first time on a reminder.</p>
    <h2>Put the term on the invoice, not in the argument</h2>
    <p>A line like “Payment due within 30 days. Overdue balances accrue interest at 1.5% per month.” in your invoice terms does two jobs: it makes the fee chargeable, and it quietly accelerates payment — clients triage invoices by consequence. Save it as a terms snippet in the <a href="/invoice/">invoice generator</a> and it lands on every invoice automatically.</p>
    <h2>Using the demand line</h2>
    <p>When an invoice does go overdue, the generated sentence above states the facts — original amount, due date, days overdue, the term being applied, and the new total — in the neutral, factual tone that gets results. Paste it into the <a href="/payment-reminder/">payment reminder generator</a>, which drafts the full email around it in your choice of friendly, firm or final-notice register.</p>`,
    faq: [
      { q: 'What late fee should I charge?', a: '1%–1.5% per month is the customary professional range and widely accepted. Whatever you choose must be stated in your terms before the work — fees announced after the fact are rarely enforceable.' },
      { q: 'How is monthly interest pro-rated?', a: 'Fee = invoice × (monthly % ÷ 100) × (days overdue ÷ 30). A $1,500 invoice at 1.5%/month, 45 days late: $1,500 × 0.015 × 1.5 = $33.75.' },
      { q: 'Are late fees legally capped?', a: 'Often, yes — usury and penalty-clause rules vary by jurisdiction. The EU directive and UK statutory interest provide floors for B2B debts; US state law may cap contractual rates. Keep fees reasonable and pre-agreed.' },
      { q: 'When does the clock start?', a: 'The day after the due date on the invoice. This calculator counts whole days between the due date and the “as of” date.' },
    ],
  },

  // ------------------------------------------------ Freelance rate
  {
    dir: 'freelance-rate-calculator',
    title: 'Freelance Rate Calculator — Hourly & Day Rate from Target Income | MyFreeInvoiceTool',
    desc: 'Work out the hourly and day rate you actually need: target income, business expenses, tax rate and realistic billable days. Free, instant and private.',
    h1: 'Freelance rate calculator',
    sub: 'Start from the life you want to fund — and get the hourly and day rate that actually pays for it.',
    features: 'Hourly rate, day rate, target income, billable days, expenses, tax adjustment',
    form: `
    <div class="calc-grid">
      <div>
        <label for="income">Target net income / year</label>
        <input id="income" type="number" min="0" step="any" placeholder="80,000" autofocus>
      </div>
      <div>
        <label for="expenses">Business expenses / year</label>
        <input id="expenses" type="number" min="0" step="any" placeholder="8,000">
      </div>
      <div>
        <label for="tax">Effective tax rate %</label>
        <input id="tax" type="number" min="0" max="80" step="any" value="25">
      </div>
      <div>
        <label for="days">Billable days / year</label>
        <input id="days" type="number" min="1" max="365" step="1" value="180">
      </div>
      <div>
        <label for="hours">Billable hours / day</label>
        <input id="hours" type="number" min="1" max="16" step="0.5" value="6">
      </div>
    </div>
    <div class="calc-results">
      <div class="result"><small>Gross revenue needed</small><strong id="r-gross">0</strong></div>
      <div class="result accent"><small>Day rate</small><strong id="r-day">0</strong></div>
      <div class="result accent"><small>Hourly rate</small><strong id="r-hour">0</strong></div>
    </div>
    <p class="muted" style="font-size:12.5px;margin:14px 0 0">Rule of thumb check: freelancers typically need 1.5–2× the equivalent employee hourly wage to break even on benefits, downtime and overhead.</p>`,
    script: `${HELPERS}
function calc() {
  const income = num('#income');
  const expenses = num('#expenses');
  const tax = Math.min(num('#tax'), 79) / 100;
  const days = Math.max(num('#days'), 1);
  const hours = Math.max(num('#hours'), 0.5);
  // net = (gross - expenses) × (1 - tax)  →  gross = net/(1-tax) + expenses
  const gross = income / (1 - tax) + expenses;
  $('#r-gross').textContent = fmt(gross, 0);
  $('#r-day').textContent = fmt(gross / days, 0);
  $('#r-hour').textContent = fmt(gross / (days * hours), 0);
}
bindAll(calc);
calc();`,
    copy: `
    <h2>Why your rate isn't your salary divided by 2,080</h2>
    <p>Employees sell about 2,080 hours a year and keep benefits, equipment, sick days and slow weeks on the employer's tab. Freelancers fund all of that from billable time — and billable time is scarcer than it looks. After sales calls, proposals, admin, invoicing (faster with <a href="/invoice/">this</a>, incidentally), learning, holidays and the gaps between projects, most full-time freelancers genuinely bill <strong>120–180 days a year</strong>, at perhaps 5–6 focused billable hours per day. Pricing as if all 260 weekdays sell is how talented people end up underwater.</p>
    <h2>The math this calculator runs</h2>
    <p>It works backwards from take-home pay. Taxes apply to profit (revenue minus expenses), so: <strong>gross revenue = target net ÷ (1 − tax rate) + expenses</strong>. Divide by billable days for the day rate, and by billable hours for the hourly rate. Example: to net 80,000 at a 25% effective tax rate with 8,000 of annual expenses, you must invoice 114,667. At 180 billable days that's a <strong>637 day rate</strong>; at 6 billable hours a day, <strong>106 an hour</strong> — far from the 38/hour the naive salary division suggests.</p>
    <h2>Choosing honest inputs</h2>
    <ul>
      <li><strong>Tax rate:</strong> use your effective (average) rate including self-employment levies, not your top marginal bracket. 20–35% is typical depending on country and income.</li>
      <li><strong>Expenses:</strong> software, hardware, insurance, co-working, accounting, marketing, training. Most solo professionals run 5–15% of revenue.</li>
      <li><strong>Billable days:</strong> be brutal. Subtract holidays, sick days, admin days, and the prospecting time between clients.</li>
    </ul>
    <h2>The rate is a floor, not a price</h2>
    <p>This number is your <em>break-even for the life you want</em> — charge below it knowingly or not at all. Actual pricing can and often should sit above it: scarce skills, urgent timelines and value-based projects command premiums. And quote day rates where you can; days resist the death-by-fifteen-minute-increments that hourly billing invites.</p>`,
    faq: [
      { q: 'How many billable days should I assume?', a: 'Most established full-time freelancers genuinely bill 120–180 days a year once holidays, admin, sales and gaps are subtracted. New freelancers should assume the low end.' },
      { q: 'Why divide by (1 − tax rate)?', a: 'Because tax is charged on your profit. To keep a target amount after tax, your pre-tax profit must be target ÷ (1 − rate); expenses are then added on top to get required revenue.' },
      { q: 'Should I charge hourly or daily?', a: 'Day rates suit project work and avoid timesheet nickel-and-diming; hourly suits open-ended or support work. This calculator gives you both from the same inputs.' },
      { q: 'Is this calculation country-specific?', a: 'No — it is pure arithmetic. Enter your local effective tax rate (including any self-employment contributions) and the result is valid anywhere, in any currency.' },
    ],
  },

  // ------------------------------------------------ Margin & markup
  {
    dir: 'margin-markup-calculator',
    title: 'Margin & Markup Calculator — Convert Between Cost, Price, Margin and Markup | MyFreeInvoiceTool',
    desc: 'Free margin and markup calculator: get profit, margin % and markup % from cost and price — or set a target margin or markup and get the selling price. Instant and private.',
    h1: 'Margin & markup calculator',
    sub: 'Two percentages, one profit — and the confusion that quietly mis-prices products. Solved in any direction.',
    features: 'Margin calculation, markup calculation, price from target margin, price from markup',
    form: `
    <div style="margin-bottom:14px">
      <label>Solve for</label>
      <div class="seg" id="mode">
        <button type="button" class="active" data-v="analyze">Margin & markup from cost + price</button>
        <button type="button" data-v="margin">Price from target margin</button>
        <button type="button" data-v="markup">Price from markup</button>
      </div>
    </div>
    <div class="calc-grid">
      <div>
        <label for="cost">Cost</label>
        <input id="cost" type="number" min="0" step="any" placeholder="60" autofocus>
      </div>
      <div id="price-wrap">
        <label for="price">Selling price</label>
        <input id="price" type="number" min="0" step="any" placeholder="100">
      </div>
      <div id="pct-wrap" hidden>
        <label for="pct"><span id="pct-label">Target margin %</span></label>
        <input id="pct" type="number" min="0" step="any" value="40">
      </div>
    </div>
    <div class="calc-results">
      <div class="result"><small>Selling price</small><strong id="r-price">0.00</strong></div>
      <div class="result accent"><small>Profit</small><strong id="r-profit">0.00</strong></div>
      <div class="result"><small>Margin</small><strong id="r-margin">0%</strong></div>
      <div class="result"><small>Markup</small><strong id="r-markup">0%</strong></div>
    </div>`,
    script: `${HELPERS}
const getMode = seg('#mode', () => { syncFields(); calc(); });
function syncFields() {
  const m = getMode();
  $('#price-wrap').hidden = m !== 'analyze';
  $('#pct-wrap').hidden = m === 'analyze';
  $('#pct-label').textContent = m === 'markup' ? 'Markup %' : 'Target margin %';
}
function calc() {
  const m = getMode();
  const cost = num('#cost');
  let price = 0;
  if (m === 'analyze') price = num('#price');
  else if (m === 'margin') {
    const margin = Math.min(num('#pct'), 99.99) / 100;
    price = cost / (1 - margin);
  } else {
    price = cost * (1 + num('#pct') / 100);
  }
  const profit = price - cost;
  $('#r-price').textContent = fmt(price);
  $('#r-profit').textContent = fmt(profit);
  $('#r-margin').textContent = price > 0 ? fmt(profit / price * 100, 1) + '%' : '—';
  $('#r-markup').textContent = cost > 0 ? fmt(profit / cost * 100, 1) + '%' : '—';
}
bindAll(calc);
syncFields();
calc();`,
    copy: `
    <h2>Margin and markup are not the same number</h2>
    <p>Both describe the same profit — the gap between cost and price — but against different bases. <strong>Markup</strong> measures profit against <em>cost</em>: price = cost × (1 + markup%). <strong>Margin</strong> measures profit against <em>price</em>: margin% = profit ÷ price. Buy at 60, sell at 100: profit is 40, markup is 66.7% (40/60), margin is 40% (40/100). Same transaction, two very different percentages — and treating them as interchangeable is one of the most expensive small-business spreadsheet errors.</p>
    <h2>The classic mistake</h2>
    <p>“We want a 50% margin, so mark everything up 50%.” A 50% markup on a 60 cost gives a 90 price — but the margin on that sale is 33.3%, not 50%. To genuinely earn a 50% margin you must charge cost ÷ (1 − 0.5) = 120, which is a 100% markup. The conversion is always: <strong>price = cost ÷ (1 − margin%)</strong>. The shortfall compounds across a whole catalogue, which is why finance teams talk in margin while procurement talks in markup — and why this calculator converts in every direction.</p>
    <h2>Handy equivalences</h2>
    <ul>
      <li>25% markup = 20% margin</li>
      <li>50% markup = 33.3% margin</li>
      <li>100% markup (keystone pricing) = 50% margin</li>
      <li>To convert: margin = markup ÷ (1 + markup); markup = margin ÷ (1 − margin).</li>
    </ul>
    <h2>Margin discipline in services</h2>
    <p>The same math governs project pricing: if a project costs you 6,000 in time (hours × your loaded rate from the <a href="/freelance-rate-calculator/">rate calculator</a>) and you want a 40% margin, quote 10,000 — not 8,400. Then put the number on a clean <a href="/quotation-maker/">quotation</a> and hold it.</p>`,
    faq: [
      { q: 'What is the difference between margin and markup?', a: 'Markup is profit as a percentage of cost; margin is profit as a percentage of selling price. Markup is always the larger number for the same transaction.' },
      { q: 'How do I price for a target margin?', a: 'Price = cost ÷ (1 − margin). For a 40% margin on a 60 cost: 60 ÷ 0.6 = 100. Using cost × 1.4 would give only a 28.6% margin.' },
      { q: 'What is keystone pricing?', a: 'Doubling the cost — a 100% markup, equal to a 50% margin. A traditional retail default, sensible only when it covers your actual overheads.' },
      { q: 'Does this work for services?', a: 'Yes — treat your delivery cost (hours × loaded rate) as the cost, and price for the margin your business needs.' },
    ],
  },

  // ------------------------------------------------ Discount
  {
    dir: 'discount-calculator',
    title: 'Discount Calculator — Final Price, Savings & Stacked Discounts | MyFreeInvoiceTool',
    desc: 'Free discount calculator: final price and savings from any percentage off, including stacked (double) discounts and the true combined rate. Instant and private.',
    h1: 'Discount calculator',
    sub: 'What it really costs after the discount — including stacked offers and the true combined percentage.',
    features: 'Discount calculation, stacked discounts, final price, total savings, effective discount rate',
    form: `
    <div class="calc-grid">
      <div>
        <label for="price">Original price</label>
        <input id="price" type="number" min="0" step="any" placeholder="200" autofocus>
      </div>
      <div>
        <label for="disc1">Discount %</label>
        <input id="disc1" type="number" min="0" max="100" step="any" value="20">
      </div>
      <div>
        <label for="disc2">Extra discount % <span class="muted">(stacked, optional)</span></label>
        <input id="disc2" type="number" min="0" max="100" step="any" placeholder="0">
      </div>
    </div>
    <div class="calc-results">
      <div class="result accent"><small>Final price</small><strong id="r-final">0.00</strong></div>
      <div class="result"><small>You save</small><strong id="r-save">0.00</strong></div>
      <div class="result"><small>Effective discount</small><strong id="r-eff">0%</strong></div>
    </div>`,
    script: `${HELPERS}
function calc() {
  const price = num('#price');
  const d1 = Math.min(num('#disc1'), 100) / 100;
  const d2 = Math.min(num('#disc2'), 100) / 100;
  const final = price * (1 - d1) * (1 - d2);
  $('#r-final').textContent = fmt(final);
  $('#r-save').textContent = fmt(price - final);
  $('#r-eff').textContent = price > 0 ? fmt((1 - final / price) * 100, 1) + '%' : '0%';
}
bindAll(calc);
calc();`,
    copy: `
    <h2>The arithmetic of “% off”</h2>
    <p>A discount reduces a price by a percentage of itself: final = price × (1 − discount/100). 20% off 200 leaves 160, saving 40. Simple — until offers stack.</p>
    <h2>Stacked discounts don't add — they multiply</h2>
    <p>“20% off, plus an extra 10% off at checkout” is <em>not</em> 30% off. The second discount applies to the already-reduced price: 200 × 0.80 × 0.90 = <strong>144</strong>, an effective discount of 28%. Retailers rely on shoppers reading 30; the gap widens with bigger numbers (50% + 50% is 75% off, not free). This calculator shows the true effective rate for any pair of stacked discounts.</p>
    <h2>Giving discounts as a business</h2>
    <ul>
      <li><strong>Know the margin cost.</strong> A 10% discount on a 30%-margin sale gives up a third of your profit. Check the damage in the <a href="/margin-markup-calculator/">margin calculator</a> before promising.</li>
      <li><strong>Anchor and justify.</strong> Show the original price and the discount as separate lines — “Design package 2,000, partnership discount −200” reads as generosity; a bare 1,800 reads as your price.</li>
      <li><strong>Trade, don't gift.</strong> The professional discount buys something: longer commitment, upfront payment, a referral, a case study.</li>
    </ul>
    <h2>Discounts on invoices, done cleanly</h2>
    <p>The <a href="/invoice/">invoice generator</a> supports both per-line discounts (a % column on each item) and a document-level discount (percent or fixed) shown as its own row before tax — so the client sees exactly what was given, and the tax computes on the discounted base, as it should.</p>`,
    faq: [
      { q: 'How do I calculate 20% off?', a: 'Multiply the price by 0.80 — or by (1 − rate/100) for any rate. 20% off 250 is 200.' },
      { q: 'Is 20% + 10% the same as 30% off?', a: 'No — stacked discounts multiply. 20% then 10% is a 28% effective discount, because the 10% applies to the already-reduced price.' },
      { q: 'Should tax be calculated before or after the discount?', a: 'After — tax applies to what the customer actually pays. Our invoice generator applies document discounts before computing tax for exactly this reason.' },
      { q: 'How much discount can I afford to give?', a: 'Depends on your margin: discount ÷ margin is the share of profit you give up. At a 30% margin, a 15% discount costs half your profit on the sale.' },
    ],
  },
];

for (const p of CALCS) {
  mkdirSync(new URL(`../${p.dir}`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`../${p.dir}/index.html`, import.meta.url), pageHTML(p));
  console.log(`wrote ${p.dir}/index.html`);
}
