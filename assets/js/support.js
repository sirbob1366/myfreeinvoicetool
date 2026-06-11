// Support widget: floating help button + searchable FAQ panel.
// Fully client-side; lazy-loaded from pwa.js after the page is interactive.

const SITE_NAME = 'MyFreeInvoiceTool';
const OPEN_KEY = 'mfit-support-open';

const supportAddr = () => ['sawantrob', 'gmail.com'].join('@');

function mailtoHref() {
  const subject = encodeURIComponent(`Support: ${SITE_NAME}`);
  const body = encodeURIComponent(
    `Browser: ${navigator.userAgent}\n\nWhat I was doing:\n\nWhat happened instead:\n`
  );
  return `mailto:${supportAddr()}?subject=${subject}&body=${body}`;
}

// q: question shown; a: answer HTML; k: extra match keywords beyond the question text.
const FAQS = [
  {
    q: 'Is it really free? What’s the catch?',
    a: 'Every feature is free with no caps — saved clients, all templates, history, bulk generation, all document types. The site is supported by clearly-labeled affiliate recommendations for full accounting suites. Your data is never the product: it stays on your device, where we can’t see it.',
    k: 'cost price pay paid premium pro upgrade subscription trial catch charge money hidden fees',
  },
  {
    q: 'Are my invoices and clients uploaded to a server?',
    a: 'No. Everything you type is stored in your browser’s local database (IndexedDB) on your own device. Nothing is uploaded, and we never see your clients, prices or revenue.',
    k: 'upload privacy private data server cloud secure security safe stored storage gdpr confidential see',
  },
  {
    q: 'How do I back up my data or move it to another computer?',
    a: 'Open the <a href="/dashboard/#backup">Workspace → Backup</a> tab and export everything as one JSON file. Import it on the other machine and your documents, clients, items and numbering all arrive. Important: clearing browser data deletes local storage, and we can’t recover it — keep a backup of anything that matters.',
    k: 'backup export import transfer move computer device sync restore lost cleared deleted recover json browser data gone disappeared missing',
  },
  {
    q: 'Will there be a watermark on my PDF?',
    a: 'No, never. The PDF contains only your branding and content — no footer credit, no “made with”, no upgrade nag.',
    k: 'watermark branding logo remove stamp free plan footer credit',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes — the whole app, including the PDF engine, is an installable PWA. After your first visit everything is cached on your device, so you can make invoices with no internet connection. Use “Install app” in the header to add it to your home screen or desktop.',
    k: 'offline internet connection install pwa app airplane flight no wifi network',
  },
  {
    q: 'How does the GST split (CGST/SGST vs IGST) work?',
    a: 'Set tax mode to GST on the <a href="/gst-invoice/">GST invoice</a>, then pick your state and the place of supply. Same state → the rate splits into CGST + SGST; different states → IGST at the full rate. It’s applied automatically, along with HSN/SAC columns.',
    k: 'gst cgst sgst igst tax india gstin hsn sac place supply state split tax invoice compliant',
  },
  {
    q: 'How do I add a UPI payment QR to my invoice?',
    a: 'In the “Payment details” card, enter your UPI ID and payee name. A scannable QR with the exact balance due is placed on the PDF automatically, and updates as the invoice changes. There’s also a standalone <a href="/upi-qr-generator/">UPI QR generator</a>.',
    k: 'upi qr code payment scan gpay phonepe paytm bhim paid link whatsapp',
  },
  {
    q: 'Why does ₹ print as “Rs.” in the downloaded PDF?',
    a: 'The PDF engine uses standard built-in fonts to keep files small and text selectable, and those fonts don’t include the ₹ glyph — so it prints as “Rs.” instead. Amounts, lakh/crore grouping and amount-in-words are unaffected. Hindi and other complex scripts render as crisp high-resolution runs for the same reason.',
    k: 'rupee symbol rs currency font character glyph hindi arabic script wrong missing display unicode',
  },
  {
    q: 'How do I turn an estimate or quotation into an invoice?',
    a: 'Save the estimate or quotation to your workspace, then use its “→ Invoice” action in the <a href="/dashboard/">Workspace</a>. Line items, client and terms carry over onto a new invoice with its own number and fresh dates.',
    k: 'convert estimate quotation quote proforma invoice accepted approved turn change save workspace',
  },
  {
    q: 'Can I create many invoices at once?',
    a: 'Yes — <a href="/bulk-invoices/">Bulk invoices</a> takes a CSV of clients and amounts, lets you map the columns, and downloads a zip of individually numbered PDFs. A sample CSV is provided on the page.',
    k: 'bulk csv batch many multiple zip mass generate hundred import spreadsheet excel',
  },
];

const CSS = `
#mfit-help-btn {
  position: fixed; right: 20px; bottom: 20px; z-index: 150;
  width: 48px; height: 48px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--emerald, #0e6b4f); color: #fff;
  font: 600 21px var(--serif, Georgia, serif);
  box-shadow: 0 2px 6px rgba(17,35,63,.18), 0 8px 28px rgba(17,35,63,.16);
  transition: background .15s ease, transform .15s ease;
}
#mfit-help-btn:hover { background: var(--emerald-dark, #0a523c); transform: translateY(-1px); }
#mfit-help-btn:focus-visible { outline: 2px solid var(--gold, #c8a24b); outline-offset: 2px; }
#mfit-help-panel {
  position: fixed; right: 20px; bottom: 80px; z-index: 150;
  width: 350px; max-width: calc(100vw - 40px); max-height: min(520px, calc(100vh - 110px));
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--paper, #fff); color: var(--body, #2c3a52);
  border: 1px solid var(--hairline, #e3ded2); border-radius: var(--radius, 10px);
  box-shadow: 0 1px 2px rgba(17,35,63,.06), 0 12px 36px rgba(17,35,63,.18);
  font: 400 14.5px var(--sans, sans-serif);
}
#mfit-help-panel[hidden] { display: none; }
.mfit-help-head {
  background: var(--ink, #11233f); color: #fff;
  padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex: none;
}
.mfit-help-head strong { font: 600 16px var(--serif, Georgia, serif); }
.mfit-help-head small { color: #93a0b5; font-size: 12px; display: block; margin-top: 1px; }
.mfit-help-close {
  margin-left: auto; border: 0; background: none; color: #c6cedd; cursor: pointer;
  font-size: 18px; line-height: 1; padding: 4px 6px; border-radius: 6px;
}
.mfit-help-close:hover { color: #fff; }
.mfit-help-search { padding: 12px 14px 0; flex: none; }
.mfit-help-search input {
  width: 100%; font: 400 14px var(--sans, sans-serif); color: var(--ink, #11233f);
  background: var(--ivory, #faf8f4); border: 1px solid var(--hairline, #e3ded2);
  border-radius: 8px; padding: 9px 11px; box-sizing: border-box;
}
.mfit-help-search input:focus { outline: 2px solid rgba(14,107,79,.35); border-color: var(--emerald, #0e6b4f); }
.mfit-help-list { overflow-y: auto; padding: 6px 14px 14px; flex: 1; }
.mfit-help-list details { border-bottom: 1px solid var(--hairline, #e3ded2); padding: 9px 0; }
.mfit-help-list details:last-of-type { border-bottom: 0; }
.mfit-help-list summary {
  font-weight: 600; color: var(--ink, #11233f); cursor: pointer; font-size: 13.5px; line-height: 1.4;
}
.mfit-help-list summary:focus-visible { outline: 2px solid rgba(14,107,79,.35); border-radius: 4px; }
.mfit-help-list details p { margin: 8px 0 2px; font-size: 13.5px; line-height: 1.5; }
.mfit-help-list a { color: var(--emerald, #0e6b4f); }
.mfit-help-fallback { padding: 4px 0 8px; font-size: 13.5px; }
.mfit-help-fallback a.mfit-mail-btn {
  display: inline-block; margin-top: 8px; background: var(--emerald, #0e6b4f); color: #fff;
  border-radius: 999px; padding: 8px 16px; font: 600 13px var(--sans, sans-serif); text-decoration: none;
}
.mfit-help-fallback a.mfit-mail-btn:hover { background: var(--emerald-dark, #0a523c); }
@media (max-width: 600px) {
  #mfit-help-panel {
    left: 0; right: 0; bottom: 0; width: auto; max-width: none;
    max-height: 78vh; border-radius: 12px 12px 0 0; border-bottom: 0;
  }
}
@media print { #mfit-help-btn, #mfit-help-panel { display: none !important; } }
`;

// ------------------------------------------------------------- search scoring

const tokenize = (s) =>
  s.toLowerCase().replace(/[^a-z0-9₹\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1);

const INDEX = FAQS.map((f) => ({ f, words: new Set(tokenize(`${f.q} ${f.k}`)) }));

function score(queryTokens, entry) {
  let s = 0;
  for (const t of queryTokens) {
    if (entry.words.has(t)) { s += 2; continue; }
    for (const w of entry.words) {
      if (w.startsWith(t) || t.startsWith(w)) { s += 1; break; }
    }
  }
  return s;
}

function search(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return FAQS;
  return INDEX
    .map((e) => [score(tokens, e), e.f])
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([, f]) => f);
}

// ------------------------------------------------------------------ widget UI

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'mfit-help-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', `${SITE_NAME} help`);
  panel.hidden = true;
  panel.innerHTML = `
    <div class="mfit-help-head">
      <div><strong>Hi — how can we help?</strong><small>Answers are instant and on-device, like everything here.</small></div>
      <button type="button" class="mfit-help-close" aria-label="Close help">✕</button>
    </div>
    <div class="mfit-help-search">
      <input type="search" placeholder="Type a question — e.g. “backup”, “GST”, “watermark”" aria-label="Search help topics">
    </div>
    <div class="mfit-help-list" aria-live="polite"></div>`;
  return panel;
}

function renderList(listEl, faqs, query) {
  if (!faqs.length) {
    listEl.innerHTML = `
      <div class="mfit-help-fallback">
        <p>No match for that one — but a human can help. Email us and we usually reply within a day or two.</p>
        <a class="mfit-mail-btn" href="${mailtoHref()}">Email support</a>
      </div>`;
    return;
  }
  listEl.innerHTML = faqs.map(({ q, a }, i) => `
    <details${query && i === 0 ? ' open' : ''}>
      <summary>${q}</summary>
      <p>${a}</p>
    </details>`).join('');
}

function init() {
  if (document.getElementById('mfit-help-btn')) return;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'mfit-help-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Help and support');
  btn.setAttribute('aria-expanded', 'false');
  btn.textContent = '?';

  const panel = buildPanel();
  const listEl = panel.querySelector('.mfit-help-list');
  const input = panel.querySelector('input');
  renderList(listEl, FAQS, '');

  function setOpen(open, focus = true) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* private mode */ }
    if (open && focus) input.focus();
    if (!open && focus) btn.focus();
  }

  btn.addEventListener('click', () => setOpen(panel.hidden));
  panel.querySelector('.mfit-help-close').addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
  input.addEventListener('input', () => renderList(listEl, search(input.value), input.value.trim()));

  document.body.append(btn, panel);

  let remembered = null;
  try { remembered = localStorage.getItem(OPEN_KEY); } catch { /* private mode */ }
  if (remembered === '1') setOpen(true, false);
}

init();
