// Bulk invoices: CSV in → mapped columns → batch of numbered vector PDFs →
// one zip, all client-side. What others charge for, unlimited and free.

import * as db from './store.js';
import { blankDocument, blankItem, compute } from './engine/model.js';
import { renderPDF } from './engine/pdf.js';
import { TEMPLATES } from './engine/templates.js';
import { CURRENCIES } from './util/money.js';
import { buildNumber, defaultSequence } from './util/numbering.js';
import { todayISO, addDays } from './util/dates.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let rows = [];
let headers = [];
let businesses = [];
let activeBiz = null;

// ---------- CSV parsing (quotes, commas, CRLF) ----------
function parseCSV(text) {
  const out = [];
  let row = [];
  let cell = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQ = false;
      } else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) out.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) out.push(row);
  return out;
}

// ---------- mapping ----------
const FIELDS = [
  ['client', 'Client name *'],
  ['email', 'Client email'],
  ['address', 'Client address'],
  ['description', 'Description *'],
  ['qty', 'Quantity'],
  ['rate', 'Rate'],
  ['amount', 'Amount (if no qty/rate)'],
];

function guessColumn(field, headerRow) {
  const aliases = {
    client: ['client', 'name', 'customer', 'company'],
    email: ['email', 'mail'],
    address: ['address'],
    description: ['description', 'item', 'service', 'details', 'work'],
    qty: ['qty', 'quantity', 'hours', 'units'],
    rate: ['rate', 'price', 'unit'],
    amount: ['amount', 'total', 'value'],
  }[field];
  return headerRow.findIndex((h) => aliases.some((a) => h.toLowerCase().includes(a)));
}

function renderMapping() {
  const wrap = $('#mapping');
  wrap.innerHTML = FIELDS.map(([key, label]) => `
    <div>
      <label>${label}</label>
      <select data-field="${key}">
        <option value="-1">— not in file —</option>
        ${headers.map((h, i) => `<option value="${i}">${esc(h)}</option>`).join('')}
      </select>
    </div>`).join('');
  for (const sel of $$('#mapping select')) {
    const guess = guessColumn(sel.dataset.field, headers);
    if (guess > -1) sel.value = String(guess);
    sel.addEventListener('input', renderPreviewTable);
  }
  renderPreviewTable();
}

function mapping() {
  const m = {};
  for (const sel of $$('#mapping select')) m[sel.dataset.field] = +sel.value;
  return m;
}

function mappedRows() {
  const m = mapping();
  const get = (row, f) => (m[f] > -1 ? (row[m[f]] || '').trim() : '');
  return rows.map((row) => {
    const qty = parseFloat(get(row, 'qty')) || 0;
    const rate = parseFloat(get(row, 'rate')) || 0;
    const amount = parseFloat(get(row, 'amount')) || 0;
    return {
      client: get(row, 'client'),
      email: get(row, 'email'),
      address: get(row, 'address'),
      description: get(row, 'description'),
      qty: qty || (amount && !rate ? 1 : qty || 1),
      rate: rate || (amount && !rate ? amount : rate),
    };
  }).filter((r) => r.client && r.description);
}

function renderPreviewTable() {
  const data = mappedRows();
  $('#row-count').textContent = data.length
    ? `${data.length} invoice${data.length === 1 ? '' : 's'} ready to generate`
    : 'No valid rows yet — every row needs at least a client name and a description.';
  const tbody = $('#preview-body');
  tbody.innerHTML = data.slice(0, 8).map((r) => `
    <tr><td>${esc(r.client)}</td><td>${esc(r.description.slice(0, 50))}</td>
    <td class="num">${r.qty}</td><td class="num">${r.rate}</td></tr>`).join('');
  $('#generate').disabled = !data.length;
}

// ---------- generation ----------
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/vendor/jszip/jszip.min.js';
    s.onload = () => resolve(window.JSZip);
    s.onerror = () => reject(new Error('Could not load zip library'));
    document.head.appendChild(s);
  });
}

async function generate() {
  const data = mappedRows();
  if (!data.length) return;
  const btn = $('#generate');
  btn.disabled = true;
  const progress = $('#progress');

  try {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    const seqKey = `inv-bulk`;
    if (!activeBiz.sequences) activeBiz.sequences = {};
    if (!activeBiz.sequences.invoice) activeBiz.sequences.invoice = defaultSequence('INV');
    const seq = activeBiz.sequences.invoice;
    const saveToWs = $('#opt-save').checked;
    const taxPct = parseFloat($('#opt-tax').value) || 0;

    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      progress.textContent = `Generating ${i + 1} of ${data.length}…`;
      const doc = blankDocument('invoice');
      doc.number = buildNumber(seq, todayISO());
      seq.next = (seq.next || 1) + 1;
      doc.business = {
        name: activeBiz.name, logo: activeBiz.logo || '', address: activeBiz.address || '',
        email: activeBiz.email || '', phone: activeBiz.phone || '',
        taxLabel: activeBiz.taxLabel || 'Tax ID', taxValue: activeBiz.taxValue || '',
      };
      doc.client = { name: r.client, email: r.email, address: r.address, phone: '', gstin: '', state: '' };
      doc.items = [{ ...blankItem(), description: r.description, qty: r.qty, rate: r.rate }];
      doc.currency = $('#opt-currency').value;
      doc.template = $('#opt-template').value;
      doc.issueDate = todayISO();
      doc.dueDate = addDays(todayISO(), parseInt($('#opt-terms').value, 10) || 30);
      if (taxPct > 0) { doc.taxMode = 'single'; doc.taxPct = taxPct; }

      const bytes = await renderPDF(doc);
      const safeClient = r.client.replace(/[^\w.-]+/g, '-').slice(0, 40);
      zip.file(`${doc.number.replace(/[^\w.-]+/g, '-')}-${safeClient}.pdf`, bytes);

      if (saveToWs) {
        const totals = compute(doc);
        await db.put('documents', {
          id: db.uid('doc_'), docType: 'invoice', businessId: activeBiz.id, number: doc.number,
          status: 'Draft', issueDate: doc.issueDate, dueDate: doc.dueDate,
          clientName: r.client, currency: doc.currency, total: totals.total, balance: totals.balance,
          ledger: [], updatedAt: new Date().toISOString(), state: JSON.parse(JSON.stringify(doc)),
        });
      }
    }
    await db.put('businesses', activeBiz);

    progress.textContent = 'Zipping…';
    const blob = await zip.generateAsync({ type: 'blob' });
    db.downloadBlob(blob, `invoices-${todayISO()}.zip`);
    progress.textContent = `Done — ${data.length} PDFs in your zip.${saveToWs ? ' Also saved to your workspace.' : ''}`;
  } catch (e) {
    console.error(e);
    progress.textContent = 'Something went wrong while generating. Please check the CSV and try again.';
  } finally {
    btn.disabled = false;
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------- boot ----------
(async () => {
  businesses = await db.all('businesses');
  if (!businesses.length) {
    const biz = { id: db.uid('biz_'), name: 'My business', sequences: { invoice: defaultSequence('INV') } };
    await db.put('businesses', biz);
    businesses = [biz];
  }
  const activeId = await db.getSetting('activeBusinessId');
  activeBiz = businesses.find((b) => b.id === activeId) || businesses[0];

  const bizSel = $('#opt-business');
  bizSel.innerHTML = businesses.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  bizSel.value = activeBiz.id;
  bizSel.addEventListener('input', () => { activeBiz = businesses.find((b) => b.id === bizSel.value); });

  $('#opt-template').innerHTML = TEMPLATES.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  $('#opt-currency').innerHTML = CURRENCIES.map((c) => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join('');
  $('#opt-currency').value = 'USD';

  $('#csv-file').addEventListener('change', async () => {
    const f = $('#csv-file').files[0];
    if (!f) return;
    const grid = parseCSV(await f.text());
    if (grid.length < 2) {
      $('#row-count').textContent = 'That file needs a header row plus at least one data row.';
      return;
    }
    headers = grid[0];
    rows = grid.slice(1);
    $('#map-section').hidden = false;
    renderMapping();
  });

  $('#generate').addEventListener('click', generate);
})();
