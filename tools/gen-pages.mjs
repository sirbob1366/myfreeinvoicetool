// Generates every engine-family document page from one template.
// Run: node tools/gen-pages.mjs
// Single source of truth for the page shell + generator form. Per-page SEO
// copy, FAQ and presets live in PAGES below.

import { writeFileSync, mkdirSync } from 'node:fs';
import { DOCTYPES } from '../assets/js/engine/doctypes.js';

const SITE = 'https://myfreeinvoicetool.com';

// ---------------------------------------------------------------- shared shell

export const NAV = `
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/"><span class="seal">✓</span>MyFreeInvoiceTool</a>
    <nav class="site-nav">
      <a href="/invoice/">Invoice</a>
      <a href="/gst-invoice/">GST Invoice</a>
      <a href="/estimate/">Estimate</a>
      <a href="/receipt-maker/">Receipt</a>
      <a href="/dashboard/" class="keep">Workspace</a>
      <a href="/invoice/" class="cta">New invoice</a>
    </nav>
  </div>
</header>`;

export const FOOTER = `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <h4>Documents</h4>
        <ul>
          <li><a href="/invoice/">Invoice generator</a></li>
          <li><a href="/gst-invoice/">GST invoice</a></li>
          <li><a href="/estimate/">Estimate</a></li>
          <li><a href="/quotation-maker/">Quotation maker</a></li>
          <li><a href="/proforma-invoice/">Proforma invoice</a></li>
          <li><a href="/receipt-maker/">Receipt maker</a></li>
          <li><a href="/rent-receipt/">Rent receipt</a></li>
          <li><a href="/salary-slip/">Salary slip</a></li>
        </ul>
      </div>
      <div>
        <h4>More documents</h4>
        <ul>
          <li><a href="/credit-note/">Credit note</a></li>
          <li><a href="/debit-note/">Debit note</a></li>
          <li><a href="/purchase-order/">Purchase order</a></li>
          <li><a href="/delivery-challan/">Delivery challan</a></li>
          <li><a href="/commercial-invoice/">Commercial invoice</a></li>
          <li><a href="/timesheet/">Timesheet</a></li>
          <li><a href="/expense-report/">Expense report</a></li>
          <li><a href="/letterhead-maker/">Letterhead maker</a></li>
        </ul>
      </div>
      <div>
        <h4>Calculators</h4>
        <ul>
          <li><a href="/gst-calculator/">GST calculator</a></li>
          <li><a href="/vat-calculator/">VAT calculator</a></li>
          <li><a href="/sales-tax-calculator/">Sales tax calculator</a></li>
          <li><a href="/late-fee-calculator/">Late fee calculator</a></li>
          <li><a href="/freelance-rate-calculator/">Freelance rate calculator</a></li>
          <li><a href="/margin-markup-calculator/">Margin &amp; markup</a></li>
          <li><a href="/discount-calculator/">Discount calculator</a></li>
        </ul>
      </div>
      <div>
        <h4>Tools</h4>
        <ul>
          <li><a href="/dashboard/">Workspace</a></li>
          <li><a href="/bulk-invoices/">Bulk invoices</a></li>
          <li><a href="/payment-reminder/">Payment reminder</a></li>
          <li><a href="/upi-qr-generator/">UPI QR generator</a></li>
        </ul>
      </div>
      <div>
        <h4>Sister tools</h4>
        <ul>
          <li><a href="#" rel="nofollow">PDF tools</a></li>
          <li><a href="#" rel="nofollow">Image tools</a></li>
          <li><a href="#" rel="nofollow">Text tools</a></li>
          <li><a href="#" rel="nofollow">Converter tools</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 MyFreeInvoiceTool — every document, zero uploads, ∞ free.</span>
      <span>Your data lives in your browser. We never see it.</span>
    </div>
  </div>
</footer>`;

// ---------------------------------------------------------------- form (the engine UI)

function formHTML(p) {
  const dt = DOCTYPES[p.doctype];
  const noun = p.noun;
  const extraCard = dt.extraFields ? `
    <section class="card">
      <h3>${p.extraCardTitle || 'Additional details'}</h3>
      <div class="row c2">
        ${dt.extraFields.map(([key, label]) => `<div><label for="x-${key}">${label}</label><input id="x-${key}" data-bind="extra.${key}"></div>`).join('\n        ')}
      </div>
    </section>` : '';

  return `
<main class="gen-shell">
  <form class="gen-form" autocomplete="off" onsubmit="return false">

    <section class="card">
      <h3>Design</h3>
      <div class="row c3">
        <div><label for="f-template">Template</label><select id="f-template" data-bind="template"></select></div>
        <div><label for="f-brand">Brand color</label><input id="f-brand" type="color" data-bind="brandColor" value="#11233f"></div>
        <div><label for="f-fontpair">Typeface</label>
          <select id="f-fontpair" data-bind="fontPair">
            <option value="serif">Serif headings</option>
            <option value="sans">Sans headings</option>
          </select>
        </div>
      </div>
      <div class="row c3">
        <div><label for="f-pagesize">Paper</label>
          <select id="f-pagesize" data-bind="pageSize">
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </div>
        <div><label for="f-currency">Currency</label><select id="f-currency" data-bind="currency"></select></div>
        <div><label for="f-lang">Document language</label><select id="f-lang" data-bind="language"></select></div>
      </div>
      <div class="row c3">
        <div><label for="f-words">Amount in words</label>
          <select id="f-words" data-bind="wordsMode">
            <option value="off">Off</option>
            <option value="western">Words (million)</option>
            <option value="indian">Words (lakh / crore)</option>
          </select>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Your business</h3>
      <div class="row" id="business-select-wrap">
        <div class="inline-actions">
          <select id="business-select" aria-label="Active business profile"></select>
          <a class="btn btn-quiet btn-sm" href="/dashboard/#businesses">Manage</a>
        </div>
      </div>
      <div class="row c2">
        <div><label for="b-name">Business / your name</label><input id="b-name" data-bind="business.name" placeholder="Acme Studio"></div>
        <div>
          <label for="logo-input">Logo</label>
          <div class="inline-actions">
            <input id="logo-input" type="file" accept="image/*">
            <button id="logo-clear" type="button" class="btn btn-quiet btn-sm">Clear</button>
          </div>
        </div>
      </div>
      <div class="row">
        <div><label for="b-address">Address</label><textarea id="b-address" rows="2" data-bind="business.address" placeholder="Street, City, Country"></textarea></div>
      </div>
      <div class="row c2">
        <div><label for="b-email">Email</label><input id="b-email" type="email" data-bind="business.email"></div>
        <div><label for="b-phone">Phone</label><input id="b-phone" data-bind="business.phone"></div>
      </div>
      <div class="row c2">
        <div><label for="b-taxlabel">Tax ID label</label><input id="b-taxlabel" data-bind="business.taxLabel" placeholder="Tax ID / VAT / GSTIN / EIN"></div>
        <div><label for="b-taxvalue">Tax ID value</label><input id="b-taxvalue" data-bind="business.taxValue"></div>
      </div>
      <p class="muted" style="font-size:12.5px;margin:8px 0 0">Saved automatically — on this device only.</p>
    </section>

    <section class="card">
      <h3>${p.partyHeading || 'Bill to'}</h3>
      <div class="row">
        <div class="inline-actions">
          <select id="client-select"></select>
          <button id="client-save" type="button" class="btn btn-quiet btn-sm">Save client</button>
        </div>
      </div>
      <div class="row c2">
        <div><label for="c-name">${p.partyNameLabel || 'Client name'}</label><input id="c-name" data-bind="client.name" placeholder="Client Co."></div>
        <div><label for="c-email">Email</label><input id="c-email" type="email" data-bind="client.email"></div>
      </div>
      <div class="row">
        <div><label for="c-address">Address</label><textarea id="c-address" rows="2" data-bind="client.address"></textarea></div>
      </div>
      <div class="row c2">
        <div><label for="c-phone">Phone</label><input id="c-phone" data-bind="client.phone"></div>
        <div><label for="c-gstin">Client GSTIN <span class="muted">(GST only)</span></label><input id="c-gstin" data-bind="client.gstin"></div>
      </div>
    </section>

    <section class="card">
      <h3>${noun} details</h3>
      <div class="row c3">
        <div><label for="f-number">${noun} number</label><input id="f-number" data-bind="number"></div>
        <div><label for="num-prefix">Prefix</label><input id="num-prefix" placeholder="${dt.prefix}"></div>
        <div><label for="num-format">Number format</label><select id="num-format"></select></div>
      </div>
      <div class="row c3">
        <div><label for="f-issue">Issue date</label><input id="f-issue" type="date" data-bind="issueDate"></div>
        <div><label for="terms-preset">Terms</label><select id="terms-preset"></select></div>
        <div><label for="f-due">${dt.hasDueDate ? 'Due date' : 'Valid until'}</label><input id="f-due" type="date" data-bind="dueDate"></div>
      </div>
      <div class="row c2">
        <div><label for="f-po">PO / reference</label><input id="f-po" data-bind="poRef"></div>
        <div><label for="f-itemmode">Billing mode</label>
          <select id="f-itemmode" data-bind="itemMode">
            <option value="qty">Quantity × rate</option>
            <option value="hours">Hours × rate</option>
          </select>
        </div>
      </div>
    </section>
${extraCard}
    <section class="card">
      <h3>Line items</h3>
      <div class="items-head">
        <span></span><span>Description</span><span id="col-qty-head">Qty</span><span>Rate</span>
        <span class="col-disc">Disc%</span><span class="col-tax">Tax%</span><span>Amount</span><span></span><span></span>
      </div>
      <div id="items-body"></div>
      <div class="items-foot">
        <button id="add-item" type="button" class="btn btn-quiet btn-sm">+ Add line</button>
        <select id="catalog-select"></select>
      </div>
      <div class="row" style="margin-top:12px">
        <label class="check"><input type="checkbox" data-bind="showLineDiscount"> Per-line discount column</label>
      </div>
    </section>

    <section class="card">
      <h3>Totals</h3>
      <div class="row c3">
        <div><label for="f-disctype">Discount</label>
          <select id="f-disctype" data-bind="discount.type">
            <option value="pct">Percent %</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div><label for="f-discval">Discount value</label><input id="f-discval" type="number" min="0" step="any" data-bind="discount.value"></div>
        <div><label for="f-taxmode">Tax</label>
          <select id="f-taxmode" data-bind="taxMode">
            <option value="none">No tax</option>
            <option value="single">Single rate</option>
            <option value="perline">Per line item</option>
            <option value="gst">GST (India)</option>
          </select>
        </div>
      </div>
      <div class="row c2" id="tax-single-fields" hidden>
        <div><label for="f-taxlabel">Tax name</label><input id="f-taxlabel" data-bind="taxLabel" placeholder="VAT, Sales Tax, GST…"></div>
        <div><label for="f-taxpct">Tax rate %</label><input id="f-taxpct" type="number" min="0" max="100" step="any" data-bind="taxPct"></div>
      </div>
      <div id="tax-gst-fields" hidden>
        <div class="row c2">
          <div><label for="g-seller">Your GSTIN</label><input id="g-seller" data-bind="gst.sellerGstin" placeholder="22AAAAA0000A1Z5"></div>
          <div><label for="g-rate">GST rate %</label>
            <select id="g-rate" data-bind="gst.rate" data-number="1">
              <option value="0">0%</option><option value="0.25">0.25%</option><option value="3">3%</option>
              <option value="5">5%</option><option value="12">12%</option>
              <option value="18" selected>18%</option><option value="28">28%</option>
            </select>
          </div>
        </div>
        <div class="row c2">
          <div><label for="g-sellerstate">Your state</label><select id="g-sellerstate" data-bind="gst.sellerState" data-states></select></div>
          <div><label for="g-supplystate">Place of supply</label><select id="g-supplystate" data-bind="gst.supplyState" data-states></select></div>
        </div>
        <p class="muted" style="font-size:12.5px;margin:6px 0 0">Same state → CGST + SGST split. Different states → IGST. Applied automatically.</p>
      </div>
      <div class="row c3" style="margin-top:12px">
        <div><label for="f-shipping">Shipping</label><input id="f-shipping" type="number" min="0" step="any" data-bind="shipping"></div>
        <div><label for="f-tip">Tip</label><input id="f-tip" type="number" min="0" step="any" data-bind="tip"></div>
        <div><label for="f-paid">Amount paid</label><input id="f-paid" type="number" min="0" step="any" data-bind="amountPaid"></div>
      </div>
    </section>

    <section class="card">
      <h3>Notes &amp; terms</h3>
      <div class="row">
        <div>
          <label for="f-notes">Notes</label>
          <textarea id="f-notes" rows="2" data-bind="notes" placeholder="Thank you for your business."></textarea>
          <div class="inline-actions" style="margin-top:6px">
            <select id="snippet-notes"></select>
            <button id="save-snippet-notes" type="button" class="btn btn-quiet btn-sm">Save snippet</button>
          </div>
        </div>
      </div>
      <div class="row">
        <div>
          <label for="f-terms">Terms</label>
          <textarea id="f-terms" rows="2" data-bind="terms" placeholder="Payment due within 30 days."></textarea>
          <div class="inline-actions" style="margin-top:6px">
            <select id="snippet-terms"></select>
            <button id="save-snippet-terms" type="button" class="btn btn-quiet btn-sm">Save snippet</button>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Payment details</h3>
      <div class="row">
        <div><label for="p-bank">Bank details</label><textarea id="p-bank" rows="2" data-bind="payment.bank" placeholder="Account name, IBAN / account no., bank, SWIFT…"></textarea></div>
      </div>
      <div class="row c3">
        <div><label for="p-paypal">PayPal.me</label><input id="p-paypal" data-bind="payment.paypal" placeholder="paypal.me/yourname"></div>
        <div><label for="p-upi">UPI ID</label><input id="p-upi" data-bind="payment.upiId" placeholder="name@upi"></div>
        <div><label for="p-upiname">UPI payee name</label><input id="p-upiname" data-bind="payment.upiName" placeholder="As registered"></div>
      </div>
      <p class="muted" style="font-size:12.5px;margin:8px 0 0">Add a UPI ID and a scannable payment QR is placed on the document automatically.</p>
    </section>

    <section class="card">
      <h3>Signature</h3>
      <div class="row c3">
        <button id="sig-open" type="button" class="btn btn-quiet btn-sm">Draw signature</button>
        <input id="sig-upload" type="file" accept="image/*" title="Upload signature image">
        <button id="sig-clear" type="button" class="btn btn-quiet btn-sm">Remove</button>
      </div>
      <div class="row" style="margin-top:10px">
        <div><label for="f-siglabel">Signature label</label><input id="f-siglabel" data-bind="signatureLabel" placeholder="Authorized signatory"></div>
      </div>
    </section>
  </form>

  <aside class="gen-preview">
    <div class="gen-toolbar">
      <button id="download-pdf" type="button" class="btn btn-primary">Download PDF</button>
      <button id="save-doc" type="button" class="btn btn-ghost">Save to workspace</button>
      <button id="share-whatsapp" type="button" class="btn btn-quiet" title="Share via WhatsApp with a UPI payment link">WhatsApp</button>
      <div id="totals-strip" class="tabular"></div>
    </div>
    <div id="preview" aria-label="Live document preview"></div>
  </aside>
</main>

<dialog id="sig-modal">
  <h3 class="mt-0">Draw your signature</h3>
  <canvas id="sig-canvas" width="1040" height="360"></canvas>
  <div class="sig-actions">
    <button id="sig-clear-pad" type="button" class="btn btn-quiet btn-sm">Clear</button>
    <button id="sig-cancel" type="button" class="btn btn-quiet btn-sm">Cancel</button>
    <button id="sig-use" type="button" class="btn btn-primary btn-sm">Use signature</button>
  </div>
</dialog>`;
}

// ---------------------------------------------------------------- page builder

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

function appJsonLd(p) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `MyFreeInvoiceTool ${p.h1}`,
    url: `${SITE}${p.path}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: p.features,
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
<link rel="canonical" href="${SITE}${p.path}">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${SITE}${p.path}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#faf8f4">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/engine.css">
<script type="application/ld+json">
${appJsonLd(p)}
</script>
<script type="application/ld+json">
${faqJsonLd(p.faq)}
</script>
<!-- GA4 placeholder: replace G-XXXXXXXXXX before launch
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
-->
</head>
<body data-doctype="${p.doctype}">
${NAV}

<div class="wrap">
  <h1 class="gen-h1">${p.h1}</h1>
  <p class="gen-sub">${p.sub}</p>
</div>

<div class="gen-tabs">
  <button class="gen-tab active" data-tab="form" type="button">Edit</button>
  <button class="gen-tab" data-tab="preview" type="button">Preview</button>
</div>
${formHTML(p)}

<section class="section">
  <div class="wrap copy">
    <div class="trustline" style="margin-bottom:34px">
      <span>No account</span><span>No watermark</span><span>No limits</span><span>Works offline</span><span>Data stays on your device</span>
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
  import { initGenerator } from '/assets/js/engine/app.js';
  initGenerator({ docType: '${p.doctype}', preset: ${JSON.stringify(p.preset || {})} });
</script>
<script type="module" src="/assets/js/pwa.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- the pages

const PRIVACY_P = `<p>Like every tool on this site, the ${'DOC'} maker runs entirely in your browser. Clients, line items and history are stored on your device in IndexedDB — never uploaded, never seen by us, exportable as a single backup file, deletable any time. It also works completely offline once loaded, and the PDF never carries a watermark.</p>`;
const priv = (doc) => PRIVACY_P.replace('DOC', doc);

export const PAGES = [
  // ---------------- invoice (flagship) ----------------
  {
    dir: 'invoice', path: '/invoice/', doctype: 'invoice', noun: 'Invoice',
    title: 'Free Invoice Generator — No Sign-Up, No Watermark, 100% Private | MyFreeInvoiceTool',
    desc: 'Create a professional PDF invoice in 60 seconds. Free forever: no account, no watermark, no limits. Your invoices and clients stay in your browser — never on our servers.',
    h1: 'Free invoice generator',
    sub: 'Professional PDF invoices in 60 seconds. No account, no watermark, no limits — and your books never leave your device.',
    features: 'PDF invoices, saved clients, 10 templates, taxes and discounts, GST, UPI QR, multi-currency, multi-language, works offline, no watermark, no account',
    copy: `
    <h2>An invoice generator that treats your business like yours</h2>
    <p>Most “free” invoice makers have a business model you can't see on the page: your client list, your prices, and your revenue history sit on their servers, fueling upsells and lead generation. This tool works differently. Everything you type — clients, line items, totals, history — is stored in your own browser using IndexedDB, on your device. We never see it. You can export your entire workspace as a single JSON file, move it to another machine, or wipe it completely. Your books never leave your device.</p>

    <h2>Everything included, nothing gated</h2>
    <p>Every feature that competitors lock behind a paid plan is simply here: saved clients, an item catalog with your usual rates, reusable notes and terms snippets, ten professional templates, your logo and brand color, automatic invoice numbering (including Indian financial-year formats like INV/2026-27/001), per-line and document-level discounts, single-rate tax or full Indian GST with automatic CGST/SGST/IGST splitting, shipping, tips, partial payments with a running balance due, amount-in-words in both million and lakh/crore styles, document labels in ten languages, and a scannable UPI payment QR printed on the PDF. There is no “Pro” version, because this is the pro version.</p>

    <h2>How to make an invoice in 60 seconds</h2>
    <ul>
      <li><strong>Add your details once.</strong> Your business name, logo and tax ID are remembered on this device for next time.</li>
      <li><strong>Pick the client.</strong> Saved clients load with one click — or type a new one and hit “Save client”.</li>
      <li><strong>Add line items.</strong> Quantity × rate or hours × rate, with optional per-line discounts and taxes. Reorder by dragging.</li>
      <li><strong>Set taxes and totals.</strong> Discounts, tax, shipping, tip, and any amount already paid — the balance due updates live.</li>
      <li><strong>Download the PDF.</strong> A crisp, vector PDF — never a blurry screenshot — with no watermark, ever.</li>
    </ul>

    <h2>A real PDF, built like a document, not a screenshot</h2>
    <p>The preview you see is the PDF you get. Documents are generated as true vector PDFs: text stays selectable and razor-sharp at any zoom, files stay small enough to email, and multi-page invoices flow naturally with repeated table headers and page numbers. Choose A4 or US Letter, and dates and numbers format themselves correctly for any of 40+ currencies.</p>

    <h2>The only invoice maker that works on a flight</h2>
    <p>Because the entire app — including PDF generation — runs in your browser, it keeps working with no connection at all. Install it like an app on your phone or laptop, and invoice from anywhere: a flight, a basement workshop, a client site with no Wi-Fi. Nothing to sync, because nothing ever left your device.</p>`,
    faq: [
      { q: "Is this invoice generator really free? What's the catch?", a: "It's free, with every feature unlocked and no usage caps. The site is supported by clearly-labeled recommendations for full accounting suites — useful only if you outgrow invoicing. Your data is never the product: it stays on your device, where we can't see or sell it." },
      { q: 'Do I need to create an account?', a: 'No. There is no sign-up, no email capture, and no login. Open the page, make your invoice, download the PDF.' },
      { q: 'Where are my invoices and clients stored?', a: "In your browser's local database (IndexedDB) on your own device. They are available to you in the Workspace, and you can export everything as one JSON backup file or delete it all at any time. Nothing is uploaded." },
      { q: 'Will there be a watermark or branding on my PDF?', a: 'No, never. The document contains only what you put on it.' },
      { q: 'Can I use it for GST invoices in India?', a: 'Yes. Switch tax mode to GST: enter your GSTIN and place of supply, and the tool automatically splits CGST + SGST for in-state sales or applies IGST for inter-state sales, adds HSN/SAC columns, and titles the document “Tax Invoice”.' },
      { q: 'Does it really work offline?', a: "Yes — it's an installable PWA. After your first visit, every page and the PDF engine are cached on your device, so the whole tool works with no internet connection." },
    ],
  },

  // ---------------- gst-invoice ----------------
  {
    dir: 'gst-invoice', path: '/gst-invoice/', doctype: 'gst-invoice', noun: 'Invoice',
    title: 'Free GST Invoice Generator — CGST/SGST/IGST Auto-Split, UPI QR | MyFreeInvoiceTool',
    desc: 'Make GST-compliant tax invoices free: automatic CGST/SGST vs IGST split by place of supply, HSN/SAC columns, ₹ formatting, amount in lakh/crore words, and a UPI payment QR on the PDF.',
    h1: 'Free GST invoice generator',
    sub: 'Compliant tax invoices with automatic CGST/SGST/IGST split, HSN/SAC columns and a scannable UPI payment QR — free, private, on your device.',
    features: 'GST tax invoice, CGST SGST IGST auto-split, HSN/SAC, place of supply, UPI QR, lakh/crore amount in words, financial-year numbering',
    preset: { taxMode: 'gst', currency: 'INR', template: 'gst-standard', wordsMode: 'indian' },
    copy: `
    <h2>GST invoices that get the split right, automatically</h2>
    <p>Under India's GST regime the tax on every invoice must be split correctly based on the place of supply. When you sell within your own state, the rate is divided equally between <strong>CGST</strong> (Central GST) and <strong>SGST</strong> (State GST) — an 18% supply becomes 9% + 9%. When the place of supply is a different state, the entire rate is charged as <strong>IGST</strong> (Integrated GST) instead. Getting this wrong is one of the most common GST filing errors. This tool removes the decision entirely: pick your state and the place of supply, and the invoice shows CGST + SGST or IGST correctly, every time.</p>

    <h2>What a valid tax invoice must contain</h2>
    <p>Rule 46 of the CGST Rules requires a tax invoice to carry: a consecutive serial number unique for the financial year; the date of issue; your name, address and GSTIN; the recipient's name, address and GSTIN (for registered buyers); the place of supply with state name and code for inter-state sales; the HSN code for goods or SAC for services; the taxable value; the rate and amount of tax (split as CGST/SGST or IGST); and the signature or digital signature of the supplier or an authorised representative. This generator covers all of these: financial-year-aware numbering like INV/2026-27/001 (April–March), GSTIN fields for both parties, a place-of-supply selector with state codes, an HSN/SAC column on every line, the automatic tax split, and a drawn or uploaded signature.</p>

    <h2>Get paid the moment the invoice lands</h2>
    <p>Add your UPI ID and the PDF carries a scannable QR encoding a proper <code>upi://pay</code> link with the payee name and exact balance due pre-filled. Your client opens any UPI app — GPay, PhonePe, Paytm, BHIM — scans, and pays the right amount with no typing. You can also share the invoice summary with the UPI link directly over WhatsApp.</p>

    <h2>₹ formatting and lakh/crore words, done properly</h2>
    <p>Amounts follow Indian digit grouping (₹12,34,567.89), and the amount-in-words line uses the Indian system — “Twelve Lakh Thirty-Four Thousand…” — as expected on Indian tax documents. The “GST Standard” template adds the boxed, gridded layout familiar to Indian accountants, with the document titled <em>Tax Invoice</em> as required.</p>

    ${priv('GST invoice')}`,
    faq: [
      { q: 'When do I charge CGST + SGST, and when IGST?', a: 'If the place of supply is in the same state as your GST registration, charge CGST + SGST (the rate split in half each). If it is in a different state or union territory, charge IGST at the full rate. This tool applies the rule automatically from the two state fields.' },
      { q: 'Is HSN/SAC mandatory on invoices?', a: 'Businesses with turnover above ₹5 crore must show 6-digit HSN codes; those above ₹1.5 crore and up to ₹5 crore must show 4-digit codes on B2B invoices. Services use 6-digit SAC codes. Each line item here has an HSN/SAC field that prints in its own column.' },
      { q: 'Does the invoice number need a specific format?', a: 'GST requires a consecutive serial number, unique for a financial year, of up to 16 characters. The financial-year format here (e.g. INV/2026-27/001) resets context each FY and is a widely used compliant pattern.' },
      { q: 'Is my GSTIN or client data uploaded anywhere?', a: 'No. Everything — GSTINs, clients, invoices — stays in your browser on your device. Nothing touches our servers.' },
      { q: 'Can the UPI QR include the invoice amount?', a: 'Yes. The QR encodes your UPI ID, payee name and the exact balance due, so the payment screen opens pre-filled. It updates automatically as the invoice changes.' },
    ],
  },

  // ---------------- estimate ----------------
  {
    dir: 'estimate', path: '/estimate/', doctype: 'estimate', noun: 'Estimate',
    title: 'Free Estimate Maker — Professional PDF Estimates That Convert to Invoices | MyFreeInvoiceTool',
    desc: 'Create professional PDF estimates free — no account, no watermark. Saved clients and items, 10 templates, and one-click conversion to an invoice when the job is approved.',
    h1: 'Free estimate maker',
    sub: 'Quotes that win work — and convert to invoices in one click when approved. Free, private, on your device.',
    features: 'PDF estimates, one-click convert to invoice, saved clients, templates, taxes and discounts, works offline',
    copy: `
    <h2>Send the estimate before the moment passes</h2>
    <p>An estimate is a sales document: it should go out while the conversation is still warm. This estimate maker opens instantly, remembers your business details and saved clients, and produces a clean, professional PDF in under a minute — itemised work, optional taxes and discounts, validity date, notes and terms, your logo and signature. No sign-up screen between you and the send button.</p>

    <h2>From estimate to invoice in one click</h2>
    <p>The quiet tax most tools charge is re-typing: the job gets approved and you rebuild the same document as an invoice. Here, every estimate you save to the workspace has a <strong>→ Invoice</strong> action that copies the line items, client and terms onto a new invoice with its own next number and fresh dates. Nothing re-typed, nothing forgotten, numbering sequences kept separate for estimates and invoices.</p>

    <h2>What belongs on a professional estimate</h2>
    <ul>
      <li><strong>A clear scope.</strong> Itemise the work — clients trust line items more than lump sums, and itemised estimates invite fewer disputes later.</li>
      <li><strong>A validity date.</strong> Prices change; the “valid until” date protects you. Use the terms presets to set it in one click.</li>
      <li><strong>Assumptions and exclusions.</strong> Use the notes and terms blocks (and save them as snippets) so every estimate carries your standard caveats.</li>
      <li><strong>Tax treatment.</strong> Show tax explicitly — an estimate that silently excludes tax is the classic source of awkward final-bill conversations.</li>
    </ul>

    <h2>Estimate vs quotation — which document do you need?</h2>
    <p>An <em>estimate</em> is an informed approximation of cost that may move as scope firms up; a <em>quotation</em> is a fixed-price offer that becomes binding when accepted. Many trades use the words interchangeably, but if you intend the price to be fixed, send a <a href="/quotation-maker/">quotation</a> instead — same engine, properly titled.</p>

    ${priv('estimate')}`,
    faq: [
      { q: 'Can I turn an estimate into an invoice?', a: 'Yes — save the estimate to your workspace, then use its “→ Invoice” action in the Dashboard. The new invoice gets its own number from your invoice sequence, today’s date, and all the line items carried over.' },
      { q: 'Is an estimate legally binding?', a: 'Generally no — an estimate is an approximation, not an offer at a fixed price. A quotation, once accepted, usually is binding. If you need a fixed-price document, use the quotation maker.' },
      { q: 'Do estimates get their own numbering?', a: 'Yes. Estimates use their own sequence (EST-001, EST-002…) per business profile, separate from your invoice numbers, so approving an estimate never creates a gap in your invoice sequence.' },
      { q: 'Is anything uploaded when I create an estimate?', a: 'No. The document, your client list and your history live in your browser on your device. Export a backup anytime; nothing reaches our servers.' },
    ],
  },

  // ---------------- quotation ----------------
  {
    dir: 'quotation-maker', path: '/quotation-maker/', doctype: 'quotation', noun: 'Quotation',
    title: 'Free Quotation Maker — Fixed-Price PDF Quotes Online | MyFreeInvoiceTool',
    desc: 'Make professional PDF quotations free: fixed-price quotes with validity dates, taxes, terms and your branding. Converts to an invoice in one click. No account, no watermark.',
    h1: 'Free quotation maker',
    sub: 'Fixed-price quotes with validity dates and your branding — converting to invoices the moment they’re accepted.',
    features: 'PDF quotations, validity date, one-click convert to invoice, saved clients, templates, taxes and discounts, works offline',
    copy: `
    <h2>A quotation is a promise — make it look like one</h2>
    <p>Unlike an estimate, a quotation is a fixed-price offer: once your customer accepts it, you're generally committed to the price and scope on the page. That makes precision and presentation matter. This quotation maker produces a clean, itemised PDF with your logo, exact line pricing, tax treatment, a validity date and your standard terms — the kind of document that wins approvals because nothing on it looks improvised.</p>

    <h2>Protect yourself with three lines</h2>
    <ul>
      <li><strong>Validity.</strong> “Valid until” caps how long the price stands — material costs and exchange rates move. Set it with one click from the terms presets.</li>
      <li><strong>Scope boundary.</strong> State what's included and, more importantly, what's not. Save your standard exclusions as a snippet and reuse them on every quote.</li>
      <li><strong>Payment terms.</strong> Deposit required? Stage payments? Say it on the quotation, not after acceptance.</li>
    </ul>

    <h2>Acceptance to invoice, without re-typing</h2>
    <p>When the client says yes, open your workspace and hit <strong>→ Invoice</strong> on the quotation: line items, client, terms and tax settings carry over onto a new invoice with its own number and current dates. Your quotation numbering (QUO-001…) and invoice numbering stay separate and sequential, per business profile.</p>

    <h2>Quotation vs estimate vs proforma</h2>
    <p>A <a href="/estimate/">quotation is fixed; an estimate</a> is an informed approximation that may move. A <a href="/proforma-invoice/">proforma invoice</a> sits one step later in the deal: it looks like an invoice and is often used to trigger an advance payment or customs process, but it isn't a demand for payment or a tax document. All three are one click apart here, on the same engine, with the right titles and numbering.</p>

    ${priv('quotation')}`,
    faq: [
      { q: 'Is a quotation legally binding?', a: 'Once accepted, a quotation is generally treated as a binding offer for the stated scope and period — which is why a validity date and clear exclusions matter. Laws vary by country; for large contracts take advice.' },
      { q: "What's the difference between a quotation and an estimate?", a: 'A quotation is a fixed price; an estimate is an approximation that can change as the work firms up. Send the document that matches your intent — both are available here with correct titles and separate numbering.' },
      { q: 'Can I convert an accepted quotation into an invoice?', a: 'Yes — save it to the workspace and use the “→ Invoice” action. Everything carries over onto a properly numbered invoice.' },
      { q: 'Can I add my logo, signature and terms?', a: 'Yes — logo and brand color, a drawn or uploaded signature, and reusable notes/terms snippets are all included, free.' },
    ],
  },

  // ---------------- proforma ----------------
  {
    dir: 'proforma-invoice', path: '/proforma-invoice/', doctype: 'proforma', noun: 'Proforma',
    title: 'Free Proforma Invoice Generator — PDF Proforma for Advance Payment & Export | MyFreeInvoiceTool',
    desc: 'Create proforma invoices free: pre-shipment or advance-payment documents with full itemisation, taxes and bank details. Converts to a final invoice in one click. No account needed.',
    h1: 'Free proforma invoice generator',
    sub: 'The “preview invoice” that unlocks advance payments and customs paperwork — free, private, on your device.',
    features: 'Proforma invoice PDF, advance payment, export documentation, convert to invoice, bank details, multi-currency',
    copy: `
    <h2>What a proforma invoice is — and isn't</h2>
    <p>A proforma invoice is a preliminary bill of sale sent before goods ship or work begins. It looks like an invoice — itemised goods or services, prices, taxes, totals, bank details — but it is <em>not</em> a demand for payment, doesn't create a receivable in your books, and is not a valid tax invoice. Businesses use it to let a buyer raise a purchase order, arrange an advance payment or letter of credit, open an import license, or simply confirm the exact cost before committing. The final, legally meaningful invoice follows once the transaction is real.</p>

    <h2>Where proformas earn their keep</h2>
    <ul>
      <li><strong>Advance payments.</strong> Many buyers can't release funds without an invoice-shaped document. A proforma with your bank details (and even a UPI QR) gets the deposit moving without issuing a real invoice prematurely.</li>
      <li><strong>International trade.</strong> Importers routinely need a proforma to open letters of credit or apply for import permits before shipment. Include precise descriptions, quantities, unit prices and currency.</li>
      <li><strong>Internal approvals.</strong> Procurement teams use proformas to budget and raise POs. The clearer your itemisation, the faster the PO lands.</li>
    </ul>

    <h2>Proforma today, invoice the moment it's confirmed</h2>
    <p>Save the proforma to your workspace; when the deal firms up, hit <strong>→ Invoice</strong> and a final invoice is created with its own sequential number and fresh dates, items intact. Proformas keep their own PRO- numbering so your invoice sequence stays clean for tax purposes.</p>

    <h2>Everything on it, exactly as the final invoice will look</h2>
    <p>Because the proforma runs on the same engine as the invoice, the final document will match what your buyer approved: same template, same itemisation, same totals — just retitled, renumbered and dated for real. Multi-currency formatting (40+ currencies), taxes including GST, shipping, discounts and amount-in-words are all available.</p>

    ${priv('proforma invoice')}`,
    faq: [
      { q: 'Is a proforma invoice a real invoice?', a: 'No. It is a preliminary document — no payment obligation, no entry in receivables, and not valid for tax credit. It exists to communicate exact costs before a sale is finalised; the real invoice follows.' },
      { q: 'Can a buyer pay against a proforma?', a: 'Yes, advance payments are commonly made against proformas — that is one of their main uses. Record the payment, then issue the final invoice showing the amount already paid.' },
      { q: 'Do proforma invoices need GST?', a: 'A proforma may show GST so the buyer sees the full landed cost, but it is not a tax invoice and cannot be used to claim input credit. Issue a proper GST tax invoice at supply time — one click converts it.' },
      { q: 'Why use a proforma in exports?', a: 'Importers often need it to open a letter of credit, arrange foreign exchange or obtain import permits before shipment. Pair it with a commercial invoice at shipping time.' },
    ],
  },

  // ---------------- receipt ----------------
  {
    dir: 'receipt-maker', path: '/receipt-maker/', doctype: 'receipt', noun: 'Receipt',
    title: 'Free Receipt Maker — Professional PDF Payment Receipts Online | MyFreeInvoiceTool',
    desc: 'Make professional PDF payment receipts free: itemised or simple, with your logo, payment method and signature. No account, no watermark, stored only on your device.',
    h1: 'Free receipt maker',
    sub: 'Clean, professional proof of payment in seconds — including automatic receipts for paid invoices.',
    features: 'PDF receipts, payment method, itemised receipts, logo and signature, automatic receipt from paid invoice',
    copy: `
    <h2>A receipt is the end of a transaction — make it a good ending</h2>
    <p>A receipt confirms that payment was received: who paid, to whom, when, for what, and how. Handing over a clean, branded receipt closes the loop professionally — and saves you the “can you send me something for my records?” email a week later. This receipt maker produces a crisp PDF with your logo, itemised goods or services (or a single line — your choice), the payment method, date, and an optional signature.</p>

    <h2>What to include on a payment receipt</h2>
    <ul>
      <li><strong>A receipt number</strong> — sequential, for your records (RCT-001…). Auto-numbered here, per business profile.</li>
      <li><strong>Date of payment</strong> — the date money changed hands, which may differ from the invoice date.</li>
      <li><strong>Payer and payee details</strong> — names and addresses on both sides.</li>
      <li><strong>What was paid for</strong> — items or a reference to the invoice number it settles (use the PO/Ref field).</li>
      <li><strong>Amount and method</strong> — cash, bank transfer, UPI, card; note it in the payment details block.</li>
    </ul>

    <h2>Paid invoice → receipt, automatically</h2>
    <p>If you invoice through this site, you rarely need to build a receipt by hand: mark an invoice paid in your <a href="/dashboard/">workspace</a> and use the <strong>→ Receipt</strong> action. A receipt is generated from the invoice's details with its own number, ready to download and send.</p>

    <h2>Need a rent receipt for HRA?</h2>
    <p>Indian tenants claiming HRA need monthly rent receipts with specific fields — landlord PAN above ₹1 lakh/year, revenue-stamp conventions, a receipt per month. We built a dedicated <a href="/rent-receipt/">rent receipt generator</a> that batch-creates the full set for any date range in one PDF.</p>

    ${priv('receipt')}`,
    faq: [
      { q: 'What makes a receipt different from an invoice?', a: 'An invoice requests payment; a receipt confirms payment happened. The receipt should reference what was paid, when, how, and by whom — this tool covers all of it.' },
      { q: 'Can I make a receipt from an invoice automatically?', a: 'Yes. Mark the invoice as paid in your workspace and click “→ Receipt”. The details carry over and the receipt gets its own sequential number.' },
      { q: 'Can I show the payment method?', a: 'Yes — note cash, bank transfer, UPI or card in the payment details block, which prints on the document.' },
      { q: 'Is my data uploaded?', a: 'No. Receipts, clients and history stay in your browser, on your device — exportable and deletable by you alone.' },
    ],
  },

  // ---------------- credit note ----------------
  {
    dir: 'credit-note', path: '/credit-note/', doctype: 'credit-note', noun: 'Credit note',
    title: 'Free Credit Note Generator — Professional PDF Credit Memos | MyFreeInvoiceTool',
    desc: 'Issue professional credit notes free: returns, overbilling corrections and post-sale discounts, referencing the original invoice. GST-aware. No account, no watermark.',
    h1: 'Free credit note generator',
    sub: 'Correct an invoice gracefully — returns, overbilling, post-sale discounts — with a properly numbered credit memo.',
    features: 'Credit note PDF, invoice reference, GST credit note, sequential numbering, professional templates',
    copy: `
    <h2>When to issue a credit note</h2>
    <p>A credit note (credit memo) is the formal way to reduce what a customer owes after an invoice has been issued. The classic triggers: goods returned or rejected; an invoice that overstated quantity or price; a post-invoice discount or goodwill gesture; services that fell short of the agreed scope. Instead of deleting or editing the original invoice — which breaks your numbering and your audit trail — you issue a credit note that references it and offsets the amount.</p>

    <h2>Reference the original, always</h2>
    <p>The single most important field on a credit note is the reference to the invoice it adjusts. Use the <strong>PO / Reference</strong> field for “Against Invoice INV-042 dated …” so both documents tie together in your records and your customer's. If you created the invoice here, the <strong>→ Credit note</strong> action in the <a href="/dashboard/">workspace</a> does this automatically — items carried over, ready to trim down to the credited amount.</p>

    <h2>Credit notes under GST</h2>
    <p>Under Section 34 of the CGST Act, a registered supplier issues a credit note when a tax invoice overstates value or tax, goods are returned, or supplies prove deficient. The credit note must be reported in your GST returns (the deadline is tied to the 30th of November following the financial year, or the annual return, whichever is earlier), and the tax reduction is only available if the recipient reverses the corresponding input credit. The GST fields here — GSTIN, place of supply, HSN/SAC, automatic CGST/SGST/IGST split — apply to credit notes exactly as they do to invoices.</p>

    <h2>Keep the paper trail clean</h2>
    <p>Credit notes get their own sequence (CRN-001…) per business profile, separate from invoices. Your invoice numbering stays unbroken — which is precisely the point of using credit notes instead of edits.</p>

    ${priv('credit note')}`,
    faq: [
      { q: 'Should I edit the invoice or issue a credit note?', a: 'Issue a credit note. Editing or deleting issued invoices breaks sequential numbering and audit trails; a credit note documents the correction while leaving history intact.' },
      { q: 'Does a credit note need to reference the invoice?', a: 'Yes — best practice (and a GST expectation) is to identify the original invoice number and date. Use the reference field, or convert directly from the invoice in your workspace.' },
      { q: 'How do credit notes work with GST?', a: 'Declare the credit note in your returns to reduce output tax liability; the recipient must reverse the matching input credit. The same GSTIN, HSN/SAC and CGST/SGST/IGST fields used on invoices are available here.' },
      { q: 'Can the amount be partial?', a: 'Yes — credit any subset of lines or a reduced quantity/price. The totals, tax split and amount-in-words recompute automatically.' },
    ],
  },

  // ---------------- debit note ----------------
  {
    dir: 'debit-note', path: '/debit-note/', doctype: 'debit-note', noun: 'Debit note',
    title: 'Free Debit Note Generator — PDF Debit Memos Online | MyFreeInvoiceTool',
    desc: 'Create debit notes free: undercharged invoices, price escalations and purchase returns, with GST fields and clean numbering. No account, no watermark, fully private.',
    h1: 'Free debit note generator',
    sub: 'The mirror of the credit note — formally increase what’s owed, or document a purchase return to your supplier.',
    features: 'Debit note PDF, invoice reference, GST debit note, sequential numbering, professional templates',
    copy: `
    <h2>Two documents share the name — both are here</h2>
    <p>“Debit note” means different things depending on who issues it. A <strong>seller</strong> issues a debit note to increase the amount a buyer owes after an invoice went out too low — an undercharge, a quantity correction, a contractual price escalation, or tax charged at the wrong rate. A <strong>buyer</strong> issues a debit note to a supplier when returning goods, formally debiting the supplier's account and requesting a credit note in response. Either way the structure is the same: reference the original invoice, itemise the adjustment, state the tax.</p>

    <h2>Seller-side: fixing an undercharge properly</h2>
    <p>Don't reissue the invoice — supplement it. The debit note carries its own sequential number (DBN-001…), cites the original invoice in the reference field, and shows only the additional amount due, with tax computed on the supplement. Under GST, Section 34 requires a supplier to issue a debit note when the original tax invoice charged less than the actual taxable value or tax; the debit note is declared in your returns and increases your output liability for that period.</p>

    <h2>Buyer-side: purchase returns that suppliers act on</h2>
    <p>Returning goods without paperwork is how disputes start. A debit note tells your supplier exactly what is being returned, against which invoice, at what value — and signals the amount you expect credited. Itemise the returned goods with quantities and rates so the supplier's credit note matches yours line for line.</p>

    <h2>Built like every document here</h2>
    <p>Same engine as the invoice: your branding, GST fields with automatic CGST/SGST/IGST split, HSN/SAC, multi-currency, amount-in-words, signature, and a separate numbering sequence per business profile. ${''}</p>

    ${priv('debit note')}`,
    faq: [
      { q: 'When does a seller issue a debit note?', a: 'When an issued invoice understated the value or tax — undercharges, quantity corrections, price escalations. The debit note adds the difference without touching the original invoice.' },
      { q: 'When does a buyer issue one?', a: 'On purchase returns: it documents goods sent back to the supplier and the amount the buyer expects credited, usually answered by the supplier’s credit note.' },
      { q: 'How are debit notes treated under GST?', a: 'A supplier’s debit note increases output tax liability and is declared in the GST returns for the period. It must reference the original invoice; the GST fields here mirror the invoice exactly.' },
      { q: 'Does the debit note get its own number?', a: 'Yes — its own DBN sequence per business profile, keeping your invoice numbering untouched.' },
    ],
  },

  // ---------------- purchase order ----------------
  {
    dir: 'purchase-order', path: '/purchase-order/', doctype: 'purchase-order', noun: 'Purchase order',
    title: 'Free Purchase Order Generator — Professional PDF POs Online | MyFreeInvoiceTool',
    desc: 'Create professional purchase orders free: itemised goods or services, delivery details and terms, with sequential PO numbering. No account, no watermark, fully private.',
    h1: 'Free purchase order generator',
    sub: 'Commit to a purchase in writing — itemised, numbered and on your letterhead — in about a minute.',
    features: 'Purchase order PDF, PO numbering, ship-to details, delivery terms, itemised ordering, professional templates',
    copy: `
    <h2>A purchase order is the buyer's side of the handshake</h2>
    <p>A purchase order (PO) is a formal document a buyer sends a supplier committing to purchase specified goods or services at specified prices. Once the supplier accepts it, the PO typically forms a binding agreement — which is why growing businesses adopt POs as the moment of spend control: nothing is ordered until someone has put a number, a price and a signature on a page. The supplier later invoices <em>against</em> the PO number, and the buyer matches invoice to PO to delivery before paying — the classic three-way match.</p>

    <h2>What a complete PO contains</h2>
    <ul>
      <li><strong>PO number</strong> — sequential and unique (PO-001…); the reference everything else hangs on. Auto-numbered here.</li>
      <li><strong>Supplier and ship-to details</strong> — who is supplying, and exactly where goods are to be delivered.</li>
      <li><strong>Itemised lines</strong> — descriptions, quantities, agreed unit prices; taxes if applicable.</li>
      <li><strong>Delivery date and terms</strong> — when it's needed and on what payment terms (use the presets: Net 15/30/60…).</li>
      <li><strong>Authorisation</strong> — the signature block that makes it official. Draw or upload yours.</li>
    </ul>

    <h2>Why bother with POs as a small business?</h2>
    <p>Because verbal orders are where money leaks. A PO pins the agreed price before the supplier invoices, creates an audit trail for every commitment, prevents duplicate or unauthorized orders, and gives you grounds to reject an invoice that doesn't match. When a supplier's invoice arrives quoting your PO number, reconciliation takes seconds instead of an email thread.</p>

    <h2>Suppliers: turn a PO into an invoice instantly</h2>
    <p>If you're on the receiving end of POs, create your invoice here and put the customer's PO number in the reference field — it prints prominently, and the finance team on the other side will clear it faster. Your <a href="/invoice/">invoice generator</a> shares clients, items and branding with this PO tool.</p>

    ${priv('purchase order')}`,
    faq: [
      { q: 'Is a purchase order legally binding?', a: 'Generally yes once the supplier accepts it — it becomes a contract for the listed goods at the listed prices. Until acceptance it is an offer to buy.' },
      { q: "What's the difference between a PO and an invoice?", a: 'The PO comes from the buyer committing to purchase; the invoice comes from the supplier requesting payment, usually citing the PO number. They are the two halves of the same transaction.' },
      { q: 'Do POs need their own numbering?', a: 'Yes — sequential PO numbers are the backbone of purchase control and three-way matching. This tool keeps a dedicated PO sequence per business profile.' },
      { q: 'Can I include delivery instructions?', a: 'Yes — use the ship-to block for the delivery address and the notes/terms blocks for dates, packaging or receiving instructions.' },
    ],
  },

  // ---------------- delivery challan ----------------
  {
    dir: 'delivery-challan', path: '/delivery-challan/', doctype: 'delivery-challan', noun: 'Delivery challan',
    title: 'Free Delivery Challan Generator — PDF Challans for Goods Movement | MyFreeInvoiceTool',
    desc: 'Create delivery challans free: job work, branch transfers, approval sales and exhibition movements, with HSN, vehicle and e-way bill fields. GST-compliant format, no account.',
    h1: 'Free delivery challan generator',
    sub: 'Move goods without a sale — job work, branch transfers, approvals — with the paperwork the checkpost expects.',
    features: 'Delivery challan PDF, job work, branch transfer, vehicle number, e-way bill reference, HSN column',
    extraCardTitle: 'Transport details',
    copy: `
    <h2>When goods move but a sale doesn't happen</h2>
    <p>A delivery challan is the document that travels with goods when a tax invoice isn't required — because no supply is taking place yet. Rule 55 of the CGST Rules names the classic cases: sending material for <strong>job work</strong> (and receiving it back), <strong>branch or godown transfers</strong> within the same state and GSTIN, goods sent on <strong>approval or sale-or-return</strong>, supply of liquid gas where quantity is unknown at removal, and transport of goods for reasons other than supply — exhibitions, repairs, testing. The challan proves the movement is legitimate and lets the goods clear inspections without an invoice.</p>

    <h2>What Rule 55 expects on the challan</h2>
    <ul>
      <li>A serial number (DC-001… — auto-numbered here) and date.</li>
      <li>Consignor and consignee names, addresses and GSTINs where registered.</li>
      <li>HSN code, description and quantity of the goods (quantity may be provisional where unknown).</li>
      <li>Taxable value, and the tax amount where the movement is in fact a supply.</li>
      <li>Place of supply (for inter-state movement) and signature.</li>
    </ul>
    <p>This generator adds the practical fields carriers actually ask for: <strong>vehicle number</strong>, <strong>transporter</strong>, and <strong>e-way bill number</strong> — all printed in the document header area.</p>

    <h2>Challan + e-way bill, together</h2>
    <p>For most goods movements above ₹50,000 an e-way bill is required even without a sale, generated against the delivery challan. Quote the e-way bill number on the challan (field provided) and keep both with the vehicle. Issue challans in triplicate by convention: original for the consignee, duplicate for the transporter, triplicate for your records — print the PDF as many times as you need; there's no page or download limit.</p>

    ${priv('delivery challan')}`,
    faq: [
      { q: 'When should I use a delivery challan instead of an invoice?', a: 'When goods move without a supply: job work, stock transfers to a branch or warehouse, sale-on-approval, exhibitions, repairs. If the movement is actually a sale, issue a tax invoice instead.' },
      { q: 'Is a delivery challan valid without an e-way bill?', a: 'For consignments above the e-way bill threshold (generally ₹50,000), you need both — the e-way bill is generated against the challan. Below the threshold the challan alone usually suffices.' },
      { q: 'Does a challan show tax?', a: 'Only where the movement is itself a supply. For job work and stock transfers within one GSTIN, show goods, quantity and value without charging tax.' },
      { q: 'What if goods sent on approval are accepted?', a: 'Issue the tax invoice at the time of acceptance (or within six months of removal, whichever is earlier). One click converts your challan’s details into an invoice here.' },
    ],
  },

  // ---------------- commercial invoice ----------------
  {
    dir: 'commercial-invoice', path: '/commercial-invoice/', doctype: 'commercial-invoice', noun: 'Commercial invoice',
    title: 'Free Commercial Invoice Generator — Export & Customs PDF | MyFreeInvoiceTool',
    desc: 'Create commercial invoices for international shipments free: HS codes, Incoterms, country of origin, AWB/BL references and multi-currency totals. No account, no watermark.',
    h1: 'Free commercial invoice generator',
    sub: 'The document customs actually reads — HS codes, Incoterms, origin and values — done properly, free.',
    features: 'Commercial invoice PDF, HS codes, Incoterms, country of origin, AWB/BL number, export reference, multi-currency',
    extraCardTitle: 'Export & customs details',
    copy: `
    <h2>The one document every international shipment needs</h2>
    <p>A commercial invoice is the primary customs document for cross-border trade. Border authorities use it to classify the goods, assess duties and taxes, and screen the shipment — so an incomplete or vague commercial invoice is the most common reason packages sit in customs. This generator includes the fields couriers and customs brokers ask for: <strong>HS codes</strong> per line item, <strong>Incoterms</strong>, <strong>country of origin and destination</strong>, the <strong>air waybill / bill of lading number</strong>, and an export reference, alongside full itemisation in any of 40+ currencies.</p>

    <h2>Get the three classification fields right</h2>
    <ul>
      <li><strong>HS code.</strong> The Harmonized System code (6 digits international, often 8–10 for the destination tariff) determines the duty rate. Each line item here has an HS code field that prints in its own column. Look codes up in the destination country's tariff schedule — guessing invites reclassification and delay.</li>
      <li><strong>Country of origin.</strong> Where the goods were manufactured — not where they shipped from. It drives trade-agreement preferences and restrictions.</li>
      <li><strong>Incoterms.</strong> EXW, FOB, CIF, DAP, DDP… three letters that allocate transport costs, insurance and risk between you and the buyer. State the term and the named place (e.g. “CIF Rotterdam”).</li>
    </ul>

    <h2>Describe goods like a customs officer is reading — because one is</h2>
    <p>“Parts” or “samples” gets shipments opened. Write what the item is, what it's made of, and what it's for: “stainless-steel bicycle chainrings, anodised, for retail sale”. Show a realistic unit value for every line, even free samples — “no commercial value” still requires a value for customs assessment. Quantities, unit prices and the total must reconcile; the engine's live math guarantees they do.</p>

    <h2>Multi-currency, properly formatted</h2>
    <p>Invoice in the contract currency — USD, EUR, GBP, AED, anything in the 40+ currency list — with correct symbols and digit grouping, and amount-in-words if your buyer's bank requires it. Pair the commercial invoice with a <a href="/proforma-invoice/">proforma</a> at quoting stage and a <a href="/purchase-order/">PO</a> on the buy side, all on one engine.</p>

    ${priv('commercial invoice')}`,
    faq: [
      { q: 'How is a commercial invoice different from a regular invoice?', a: 'It adds the customs-critical data: HS codes, country of origin, Incoterms, transport references and per-line values used to assess duties. It travels with the shipment as well as being billed to the buyer.' },
      { q: 'What are Incoterms and which should I use?', a: 'Incoterms are standard three-letter trade terms allocating costs and risk. EXW puts almost everything on the buyer; DDP puts it on you; FOB and CIF sit between, mainly for sea freight. State the term plus the named place on the invoice.' },
      { q: 'Do I need an HS code for every item?', a: 'Yes — customs classifies and taxes each line by its HS code. Use at least the 6-digit international code; the destination tariff may require more digits.' },
      { q: 'What value do I declare for samples or replacements?', a: 'A realistic market value, always. “Zero value” invoices are rejected; customs requires a value for assessment even when no payment occurs — you may note “value for customs purposes only”.' },
    ],
  },
];

// ---------------------------------------------------------------- generate

for (const p of PAGES) {
  mkdirSync(new URL(`../${p.dir}`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`../${p.dir}/index.html`, import.meta.url), pageHTML(p));
  console.log(`wrote ${p.dir}/index.html`);
}
