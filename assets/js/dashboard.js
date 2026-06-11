// Workspace dashboard: history, ledger, conversions, clients/items/snippets
// managers, multi-business profiles, backup. All IndexedDB, zero accounts.

import * as db from './store.js';
import { displayStatus, STATUSES } from './docstatus.js';
import { formatMoney, CURRENCIES } from './util/money.js';
import { formatDate, todayISO, addDays, parseISO } from './util/dates.js';
import { compute } from './engine/model.js';
import { buildNumber, defaultSequence, NUMBER_FORMATS } from './util/numbering.js';
import { TEMPLATES } from './engine/templates.js';
import { doctype as getDoctype, DOCTYPES } from './engine/doctypes.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let documents = [];
let clients = [];
let items = [];
let snippets = [];
let businesses = [];
let activeBusinessId = null;

const state = { search: '', status: 'all', type: 'all', business: 'all' };

// ---------------------------------------------------------------- utilities

function flash(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function money(v, cur) { return formatMoney(+v || 0, cur || 'USD'); }

async function reload() {
  [documents, clients, items, snippets, businesses] = await Promise.all([
    db.all('documents'), db.all('clients'), db.all('items'), db.all('snippets'), db.all('businesses'),
  ]);
  activeBusinessId = await db.getSetting('activeBusinessId');
  documents.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

function renderAll() {
  renderRevenue();
  renderDocuments();
  renderClients();
  renderItems();
  renderSnippets();
  renderBusinesses();
}

// ---------------------------------------------------------------- revenue strip

function fyStartMonth() {
  return documents.some((d) => d.currency === 'INR') ? 3 : 0; // April for INR books, else January
}

function inPeriod(iso, startDate) {
  if (!iso) return false;
  const d = parseISO(iso);
  return d && d >= startDate;
}

function renderRevenue() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fyM = fyStartMonth();
  const fyStart = new Date(now.getMonth() >= fyM ? now.getFullYear() : now.getFullYear() - 1, fyM, 1);

  // Use the dominant currency for the strip; mixed currencies are summed per
  // their face value and labelled with the dominant symbol.
  const counts = {};
  for (const d of documents) counts[d.currency] = (counts[d.currency] || 0) + 1;
  const cur = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'USD';

  const sum = (docs, f) => docs.reduce((s, d) => s + (+f(d) || 0), 0);
  const docsM = documents.filter((d) => inPeriod(d.issueDate, monthStart) && d.status !== 'Draft');
  const docsFY = documents.filter((d) => inPeriod(d.issueDate, fyStart) && d.status !== 'Draft');
  const outstanding = documents.filter((d) => (+d.balance || 0) > 0 && d.status !== 'Draft');

  const strip = $('#rev-strip');
  strip.innerHTML = `
    <div class="rev-card"><small>Invoiced · this month</small><strong>${money(sum(docsM, (d) => d.total), cur)}</strong></div>
    <div class="rev-card accent"><small>Paid · this month</small><strong>${money(sum(docsM, (d) => d.total - d.balance), cur)}</strong></div>
    <div class="rev-card"><small>Invoiced · this FY</small><strong>${money(sum(docsFY, (d) => d.total), cur)}</strong></div>
    <div class="rev-card accent"><small>Paid · this FY</small><strong>${money(sum(docsFY, (d) => d.total - d.balance), cur)}</strong></div>
    <div class="rev-card"><small>Outstanding</small><strong>${money(sum(outstanding, (d) => d.balance), cur)}</strong></div>`;
}

// ---------------------------------------------------------------- documents

function editorUrl(rec) {
  const page = getDoctype(rec.docType).page || '/invoice/';
  return `${page}?doc=${encodeURIComponent(rec.id)}`;
}

function typeLabel(docType) {
  return (getDoctype(docType).fileLabel || 'Document').replace(/-/g, ' ');
}

function renderDocuments() {
  const tbody = $('#docs-body');
  const typeSel = $('#filter-type');
  if (typeSel && typeSel.options.length <= 1) {
    typeSel.innerHTML = '<option value="all">All types</option>' +
      Object.keys(DOCTYPES).map((t) => `<option value="${t}">${typeLabel(t)}</option>`).join('');
  }
  const bizSel = $('#filter-business');
  if (bizSel) {
    bizSel.hidden = businesses.length < 2;
    bizSel.innerHTML = '<option value="all">All businesses</option>' +
      businesses.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
    bizSel.value = state.business;
  }

  const q = state.search.toLowerCase();
  const rows = documents.filter((d) => {
    if (state.type !== 'all' && d.docType !== state.type) return false;
    if (state.business !== 'all' && d.businessId !== state.business) return false;
    const st = displayStatus(d);
    if (state.status !== 'all' && st !== state.status) return false;
    if (q && !(`${d.number} ${d.clientName}`.toLowerCase().includes(q))) return false;
    return true;
  });

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      ${documents.length ? 'Nothing matches your filters.' : 'No documents yet. <a href="/invoice/">Create your first invoice</a> — it will appear here, stored on this device.'}
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((d) => {
    const st = displayStatus(d);
    const dt = getDoctype(d.docType);
    const convertTargets = [];
    if (dt.convertsTo) convertTargets.push([dt.convertsTo, `→ ${typeLabel(dt.convertsTo)}`]);
    if (d.docType === 'invoice' || d.docType === 'gst-invoice') {
      if (st === 'Paid') convertTargets.push(['receipt', '→ Receipt']);
      convertTargets.push(['credit-note', '→ Credit note']);
    }
    return `<tr data-id="${d.id}">
      <td class="doc-number"><a href="${editorUrl(d)}">${esc(d.number)}</a></td>
      <td>${esc(d.clientName || '—')}</td>
      <td>${typeLabel(d.docType)}</td>
      <td class="num">${formatDate(d.issueDate)}</td>
      <td class="num">${d.dueDate ? formatDate(d.dueDate) : '—'}</td>
      <td class="num">${money(d.total, d.currency)}</td>
      <td class="num">${money(d.balance, d.currency)}</td>
      <td><span class="badge ${st}">${st}</span></td>
      <td class="actions">
        <button class="row-btn" data-act="open">Open</button>
        <button class="row-btn" data-act="dup" title="Duplicate with the next number — honest recurring">Duplicate</button>
        ${dt.hasBalance ? '<button class="row-btn" data-act="ledger">Payments</button>' : ''}
        ${st !== 'Paid' && dt.hasBalance ? '<button class="row-btn" data-act="paid">Mark paid</button>' : ''}
        ${convertTargets.map(([t, l]) => `<button class="row-btn muted" data-act="convert" data-target="${t}">${l}</button>`).join('')}
        <button class="row-btn danger" data-act="del">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

async function docAction(id, act, target) {
  const rec = documents.find((d) => d.id === id);
  if (!rec) return;
  if (act === 'open') { location.href = editorUrl(rec); return; }
  if (act === 'del') {
    if (!confirm(`Delete ${rec.number}? This cannot be undone.`)) return;
    await db.del('documents', id);
    await reload(); renderAll();
    flash(`${rec.number} deleted.`);
    return;
  }
  if (act === 'paid') {
    await recordPayment(rec, +rec.balance || 0, todayISO(), 'Marked paid');
    flash(`${rec.number} marked paid.`);
    return;
  }
  if (act === 'ledger') { openLedger(rec); return; }
  if (act === 'dup') { await duplicateDoc(rec); return; }
  if (act === 'convert') { await convertDoc(rec, target); return; }
}

function bizFor(rec) {
  return businesses.find((b) => b.id === rec.businessId) || businesses[0] || null;
}

async function nextNumberFor(rec, docType) {
  const biz = bizFor(rec);
  if (!biz) return { number: 'DOC-001' };
  if (!biz.sequences) biz.sequences = {};
  if (!biz.sequences[docType]) biz.sequences[docType] = defaultSequence(getDoctype(docType).prefix);
  const seq = biz.sequences[docType];
  const number = buildNumber(seq, todayISO());
  seq.next = (seq.next || 1) + 1;
  await db.put('businesses', biz);
  return { number };
}

async function duplicateDoc(rec) {
  const { number } = await nextNumberFor(rec, rec.docType);
  const state2 = JSON.parse(JSON.stringify(rec.state));
  state2.number = number;
  state2.issueDate = todayISO();
  const preset = state2.termsPreset;
  const days = { receipt: 0, net7: 7, net15: 15, net30: 30, net45: 45, net60: 60 }[preset];
  state2.dueDate = days != null ? addDays(state2.issueDate, days) : state2.dueDate;
  state2.amountPaid = 0;
  state2.ledger = [];
  const totals = compute(state2);
  const id = db.uid('doc_');
  await db.put('documents', {
    id, docType: rec.docType, businessId: rec.businessId, number,
    status: 'Draft', issueDate: state2.issueDate, dueDate: state2.dueDate,
    clientName: state2.client.name, currency: state2.currency,
    total: totals.total, balance: totals.balance, ledger: [],
    updatedAt: new Date().toISOString(), state: state2,
  });
  location.href = `/invoice/?doc=${id}`;
}

async function convertDoc(rec, targetType) {
  const { number } = await nextNumberFor(rec, targetType);
  const state2 = JSON.parse(JSON.stringify(rec.state));
  state2.docType = targetType;
  state2.number = number;
  state2.issueDate = todayISO();
  if (targetType === 'invoice') state2.dueDate = addDays(todayISO(), 30);
  if (targetType === 'receipt') { state2.amountPaid = 0; state2.ledger = rec.ledger || []; }
  if (targetType === 'credit-note') { state2.amountPaid = 0; state2.ledger = []; }
  const totals = compute(state2);
  const id = db.uid('doc_');
  await db.put('documents', {
    id, docType: targetType, businessId: rec.businessId, number,
    status: 'Draft', issueDate: state2.issueDate, dueDate: state2.dueDate,
    clientName: state2.client.name, currency: state2.currency,
    total: totals.total, balance: totals.balance, ledger: state2.ledger || [],
    updatedAt: new Date().toISOString(), state: state2,
  });
  flash(`${typeLabel(targetType)} ${number} created from ${rec.number}.`);
  location.href = `/invoice/?doc=${id}`;
}

// ---------------------------------------------------------------- payment ledger

async function recordPayment(rec, amount, date, note) {
  rec.ledger = rec.ledger || [];
  if (amount > 0) rec.ledger.push({ date, amount, note: note || '' });
  rec.state.ledger = rec.ledger;
  const totals = compute(rec.state);
  rec.total = totals.total;
  rec.balance = totals.balance;
  if (rec.balance <= 0 && rec.total > 0) rec.status = 'Paid';
  else if (totals.paid > 0) rec.status = 'Partial';
  rec.updatedAt = new Date().toISOString();
  await db.put('documents', rec);
  await reload(); renderAll();
}

function openLedger(rec) {
  const dlg = $('#ledger-dialog');
  $('#ledger-title').textContent = `Payments — ${rec.number}`;
  $('#ledger-date').value = todayISO();
  $('#ledger-amount').value = (+rec.balance || 0) > 0 ? rec.balance : '';
  $('#ledger-note').value = '';

  function renderList() {
    const list = $('#ledger-list');
    const ledger = rec.ledger || [];
    list.innerHTML = ledger.length
      ? ledger.map((p, i) => `<li>
          <span>${formatDate(p.date)}</span>
          <span class="muted">${esc(p.note || '')}</span>
          <span class="l-amount">${money(p.amount, rec.currency)}</span>
          <button class="row-btn danger" data-i="${i}">×</button>
        </li>`).join('')
      : '<li class="muted">No payments recorded yet.</li>';
    $('#ledger-balance').textContent = `Balance due: ${money(rec.balance, rec.currency)}`;
    $$('#ledger-list button').forEach((btn) => {
      btn.onclick = async () => {
        rec.ledger.splice(+btn.dataset.i, 1);
        await recordPayment(rec, 0, todayISO());
        renderList();
      };
    });
  }
  renderList();

  $('#ledger-add').onclick = async () => {
    const amount = +$('#ledger-amount').value;
    if (!(amount > 0)) return flash('Enter a payment amount.');
    await recordPayment(rec, amount, $('#ledger-date').value || todayISO(), $('#ledger-note').value);
    renderList();
    $('#ledger-amount').value = (+rec.balance || 0) > 0 ? rec.balance : '';
    $('#ledger-note').value = '';
  };
  $('#ledger-print').checked = !!rec.state.showLedgerOnDoc;
  $('#ledger-print').onchange = async () => {
    rec.state.showLedgerOnDoc = $('#ledger-print').checked;
    await db.put('documents', rec);
  };
  $('#ledger-close').onclick = () => dlg.close();
  dlg.showModal();
}

// ---------------------------------------------------------------- clients

function renderClients() {
  const tbody = $('#clients-body');
  tbody.innerHTML = clients.length
    ? clients.map((c) => `<tr data-id="${c.id}">
        <td class="doc-number">${esc(c.name)}</td>
        <td>${esc(c.email || '—')}</td>
        <td>${esc(c.phone || '—')}</td>
        <td>${esc(c.gstin || '—')}</td>
        <td class="actions">
          <button class="row-btn" data-act="edit">Edit</button>
          <button class="row-btn danger" data-act="del">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state">No saved clients yet. Save one from any document page, or add one here.</div></td></tr>';
}

function openClientDialog(client) {
  const dlg = $('#client-dialog');
  const isNew = !client;
  client = client || { id: db.uid('cli_'), name: '', address: '', email: '', phone: '', gstin: '', state: '' };
  $('#cd-title').textContent = isNew ? 'Add client' : 'Edit client';
  $('#cd-name').value = client.name;
  $('#cd-address').value = client.address || '';
  $('#cd-email').value = client.email || '';
  $('#cd-phone').value = client.phone || '';
  $('#cd-gstin').value = client.gstin || '';
  $('#cd-save').onclick = async () => {
    client.name = $('#cd-name').value.trim();
    if (!client.name) return flash('A name is required.');
    client.address = $('#cd-address').value;
    client.email = $('#cd-email').value;
    client.phone = $('#cd-phone').value;
    client.gstin = $('#cd-gstin').value;
    await db.put('clients', client);
    dlg.close();
    await reload(); renderAll();
  };
  $('#cd-cancel').onclick = () => dlg.close();
  dlg.showModal();
}

// ---------------------------------------------------------------- items

function renderItems() {
  const tbody = $('#items-list-body');
  tbody.innerHTML = items.length
    ? items.map((i) => `<tr data-id="${i.id}">
        <td>${esc(i.description)}</td>
        <td class="num">${(+i.rate || 0).toLocaleString()}</td>
        <td class="num">${i.taxPct ? `${i.taxPct}%` : '—'}</td>
        <td>${esc(i.hsn || '—')}</td>
        <td class="actions">
          <button class="row-btn" data-act="edit">Edit</button>
          <button class="row-btn danger" data-act="del">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state">No saved items. Star a line item on any document, or add one here.</div></td></tr>';
}

function openItemDialog(item) {
  const dlg = $('#item-dialog');
  const isNew = !item;
  item = item || { id: db.uid('itm_'), description: '', rate: 0, taxPct: 0, hsn: '' };
  $('#id-title').textContent = isNew ? 'Add item' : 'Edit item';
  $('#id-desc').value = item.description;
  $('#id-rate').value = item.rate || '';
  $('#id-tax').value = item.taxPct || '';
  $('#id-hsn').value = item.hsn || '';
  $('#id-save').onclick = async () => {
    item.description = $('#id-desc').value.trim();
    if (!item.description) return flash('A description is required.');
    item.rate = +$('#id-rate').value || 0;
    item.taxPct = +$('#id-tax').value || 0;
    item.hsn = $('#id-hsn').value;
    await db.put('items', item);
    dlg.close();
    await reload(); renderAll();
  };
  $('#id-cancel').onclick = () => dlg.close();
  dlg.showModal();
}

// ---------------------------------------------------------------- snippets

function renderSnippets() {
  const tbody = $('#snippets-body');
  tbody.innerHTML = snippets.length
    ? snippets.map((s) => `<tr data-id="${s.id}">
        <td>${s.kind === 'terms' ? 'Terms' : 'Notes'}</td>
        <td class="doc-number">${esc(s.title)}</td>
        <td>${esc(s.text.slice(0, 80))}${s.text.length > 80 ? '…' : ''}</td>
        <td class="actions">
          <button class="row-btn" data-act="edit">Edit</button>
          <button class="row-btn danger" data-act="del">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="4"><div class="empty-state">No snippets yet. Save reusable notes & terms from any document page.</div></td></tr>';
}

function openSnippetDialog(snippet) {
  const dlg = $('#snippet-dialog');
  const isNew = !snippet;
  snippet = snippet || { id: db.uid('snp_'), kind: 'notes', title: '', text: '' };
  $('#sd-title').textContent = isNew ? 'Add snippet' : 'Edit snippet';
  $('#sd-kind').value = snippet.kind;
  $('#sd-name').value = snippet.title;
  $('#sd-text').value = snippet.text;
  $('#sd-save').onclick = async () => {
    snippet.text = $('#sd-text').value.trim();
    if (!snippet.text) return flash('Snippet text is required.');
    snippet.kind = $('#sd-kind').value;
    snippet.title = $('#sd-name').value.trim() || snippet.text.split('\n')[0].slice(0, 48);
    await db.put('snippets', snippet);
    dlg.close();
    await reload(); renderAll();
  };
  $('#sd-cancel').onclick = () => dlg.close();
  dlg.showModal();
}

// ---------------------------------------------------------------- businesses

function renderBusinesses() {
  const grid = $('#biz-grid');
  grid.innerHTML = businesses.map((b) => {
    const seq = (b.sequences && b.sequences.invoice) || defaultSequence('INV');
    return `<div class="biz-card ${b.id === activeBusinessId ? 'active-biz' : ''}" data-id="${b.id}">
      ${b.logo ? `<img class="biz-logo" src="${b.logo}" alt="">` : ''}
      <h4>${esc(b.name)}</h4>
      <div class="meta">${esc([b.email, b.taxValue ? `${b.taxLabel}: ${b.taxValue}` : ''].filter(Boolean).join('\n'))}
Next invoice no.: ${esc(buildNumber(seq, todayISO()))}</div>
      ${b.id === activeBusinessId ? '<span class="badge Paid">Active</span>' : '<button class="row-btn" data-act="activate">Set active</button>'}
      <button class="row-btn" data-act="edit">Edit</button>
      ${businesses.length > 1 ? '<button class="row-btn danger" data-act="del">Delete</button>' : ''}
    </div>`;
  }).join('') + `<div class="biz-card" style="display:flex;align-items:center;justify-content:center">
    <button class="btn btn-quiet" id="biz-add">+ Add business</button>
  </div>`;

  $('#biz-add').onclick = () => openBizDialog(null);
  $$('#biz-grid .biz-card[data-id]').forEach((card) => {
    const biz = businesses.find((b) => b.id === card.dataset.id);
    $$('.row-btn', card).forEach((btn) => {
      btn.onclick = async () => {
        if (btn.dataset.act === 'activate') {
          await db.setSetting('activeBusinessId', biz.id);
          await reload(); renderAll();
        } else if (btn.dataset.act === 'edit') {
          openBizDialog(biz);
        } else if (btn.dataset.act === 'del') {
          if (!confirm(`Delete business “${biz.name}”? Its documents stay in history.`)) return;
          await db.del('businesses', biz.id);
          if (activeBusinessId === biz.id) await db.setSetting('activeBusinessId', businesses.find((b) => b.id !== biz.id)?.id || null);
          await reload(); renderAll();
        }
      };
    });
  });
}

function openBizDialog(biz) {
  const dlg = $('#biz-dialog');
  const isNew = !biz;
  biz = biz || {
    id: db.uid('biz_'), name: '', logo: '', address: '', email: '', phone: '',
    taxLabel: 'Tax ID', taxValue: '', sequences: { invoice: defaultSequence('INV') }, defaults: {},
  };
  if (!biz.sequences) biz.sequences = {};
  if (!biz.sequences.invoice) biz.sequences.invoice = defaultSequence('INV');
  const seq = biz.sequences.invoice;

  $('#bd-title').textContent = isNew ? 'Add business' : `Edit ${biz.name || 'business'}`;
  $('#bd-name').value = biz.name;
  $('#bd-address').value = biz.address || '';
  $('#bd-email').value = biz.email || '';
  $('#bd-phone').value = biz.phone || '';
  $('#bd-taxlabel').value = biz.taxLabel || 'Tax ID';
  $('#bd-taxvalue').value = biz.taxValue || '';
  $('#bd-prefix').value = seq.prefix;
  $('#bd-next').value = seq.next || 1;
  const fmtSel = $('#bd-format');
  fmtSel.innerHTML = NUMBER_FORMATS.map((f) => `<option value="${f.id}">${f.label}</option>`).join('');
  fmtSel.value = seq.format;
  const curSel = $('#bd-currency');
  curSel.innerHTML = '<option value="">Default currency…</option>' + CURRENCIES.map((c) => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join('');
  curSel.value = (biz.defaults && biz.defaults.currency) || '';
  const tplSel = $('#bd-template');
  tplSel.innerHTML = '<option value="">Default template…</option>' + TEMPLATES.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  tplSel.value = (biz.defaults && biz.defaults.template) || '';

  $('#bd-logo').value = '';
  $('#bd-logo').onchange = () => {
    const f = $('#bd-logo').files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { biz.logo = r.result; };
    r.readAsDataURL(f);
  };
  $('#bd-logo-clear').onclick = () => { biz.logo = ''; };

  $('#bd-save').onclick = async () => {
    biz.name = $('#bd-name').value.trim();
    if (!biz.name) return flash('A business name is required.');
    biz.address = $('#bd-address').value;
    biz.email = $('#bd-email').value;
    biz.phone = $('#bd-phone').value;
    biz.taxLabel = $('#bd-taxlabel').value || 'Tax ID';
    biz.taxValue = $('#bd-taxvalue').value;
    seq.prefix = $('#bd-prefix').value || 'INV';
    seq.next = Math.max(1, +$('#bd-next').value || 1);
    seq.format = fmtSel.value;
    biz.defaults = { currency: curSel.value || undefined, template: tplSel.value || undefined };
    await db.put('businesses', biz);
    if (isNew && businesses.length === 0) await db.setSetting('activeBusinessId', biz.id);
    dlg.close();
    await reload(); renderAll();
  };
  $('#bd-cancel').onclick = () => dlg.close();
  dlg.showModal();
}

// ---------------------------------------------------------------- backup

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCSV() {
  const head = ['Number', 'Type', 'Status', 'Issue date', 'Due date', 'Client', 'Currency', 'Total', 'Paid', 'Balance'];
  const lines = [head.join(',')];
  for (const d of documents) {
    lines.push([
      d.number, typeLabel(d.docType), displayStatus(d), d.issueDate, d.dueDate || '',
      d.clientName || '', d.currency, d.total, (d.total - d.balance).toFixed(2), d.balance,
    ].map(csvCell).join(','));
  }
  db.downloadBlob(lines.join('\r\n'), `myfreeinvoicetool-documents-${todayISO()}.csv`, 'text/csv');
}

function bindBackup() {
  $('#backup-export').onclick = async () => {
    db.downloadBlob(await db.exportBackup(), `myfreeinvoicetool-backup-${todayISO()}.json`, 'application/json');
  };
  $('#backup-csv').onclick = exportCSV;
  $('#backup-import').onchange = async () => {
    const f = $('#backup-import').files[0];
    if (!f) return;
    const replace = confirm('Click OK to REPLACE everything on this device with the backup, or Cancel to merge it into the existing data.');
    try {
      await db.importBackup(await f.text(), { merge: !replace });
      await reload(); renderAll();
      flash('Backup imported.');
    } catch (e) {
      flash(e.message || 'That file is not a valid backup.');
    }
    $('#backup-import').value = '';
  };
  $('#erase-all').onclick = async () => {
    if (!confirm('Erase ALL data on this device — documents, clients, businesses, settings?')) return;
    if (!confirm('Are you absolutely sure? There is no undo, and no copy exists anywhere else.')) return;
    const dbi = await db.openDB();
    await Promise.all(db.STORES.map((s) => new Promise((res, rej) => {
      const t = dbi.transaction(s, 'readwrite');
      t.objectStore(s).clear();
      t.oncomplete = res; t.onerror = () => rej(t.error);
    })));
    await reload(); renderAll();
    flash('All local data erased.');
  };
}

// ---------------------------------------------------------------- tabs & events

function showTab(name) {
  $$('.dash-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  $$('.dash-panel').forEach((p) => { p.hidden = p.id !== `panel-${name}`; });
  history.replaceState(null, '', `#${name}`);
}

function bindEvents() {
  $$('.dash-tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

  $('#search').addEventListener('input', (e) => { state.search = e.target.value; renderDocuments(); });
  $('#filter-status').innerHTML = '<option value="all">All statuses</option>' + STATUSES.map((s) => `<option>${s}</option>`).join('');
  $('#filter-status').addEventListener('input', (e) => { state.status = e.target.value; renderDocuments(); });
  $('#filter-type').addEventListener('input', (e) => { state.type = e.target.value; renderDocuments(); });
  $('#filter-business').addEventListener('input', (e) => { state.business = e.target.value; renderDocuments(); });
  $('#docs-csv').addEventListener('click', exportCSV);

  $('#docs-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    docAction(btn.closest('tr').dataset.id, btn.dataset.act, btn.dataset.target);
  });

  $('#client-add').addEventListener('click', () => openClientDialog(null));
  $('#clients-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('tr').dataset.id;
    const client = clients.find((c) => c.id === id);
    if (btn.dataset.act === 'edit') openClientDialog(client);
    else if (confirm(`Delete client “${client.name}”?`)) { await db.del('clients', id); await reload(); renderAll(); }
  });

  $('#item-add').addEventListener('click', () => openItemDialog(null));
  $('#items-list-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('tr').dataset.id;
    const item = items.find((i) => i.id === id);
    if (btn.dataset.act === 'edit') openItemDialog(item);
    else if (confirm('Delete this saved item?')) { await db.del('items', id); await reload(); renderAll(); }
  });

  $('#snippet-add').addEventListener('click', () => openSnippetDialog(null));
  $('#snippets-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('tr').dataset.id;
    const snippet = snippets.find((s) => s.id === id);
    if (btn.dataset.act === 'edit') openSnippetDialog(snippet);
    else if (confirm('Delete this snippet?')) { await db.del('snippets', id); await reload(); renderAll(); }
  });

  bindBackup();
}

// ---------------------------------------------------------------- boot

(async () => {
  await reload();
  bindEvents();
  renderAll();
  const tab = location.hash.slice(1);
  showTab(['documents', 'clients', 'items', 'snippets', 'businesses', 'backup'].includes(tab) ? tab : 'documents');
})();
