// Generator page controller. Binds the form to the document model, keeps the
// live preview in sync, and handles persistence (businesses, clients, items,
// snippets, numbering) plus PDF download and save-to-workspace.

import { blankDocument, blankItem, compute } from './model.js';
import { layoutDocument } from './layout.js';
import { renderPreview, fitPreview, canvasMeasure } from './preview.js';
import { renderPDF } from './pdf.js';
import { TEMPLATES } from './templates.js';
import { CURRENCIES, formatMoney } from '../util/money.js';
import { TERMS_PRESETS, addDays, todayISO } from '../util/dates.js';
import { NUMBER_FORMATS, buildNumber, defaultSequence } from '../util/numbering.js';
import { IN_STATES } from '../util/states.js';
import { doctype as getDoctype } from './doctypes.js';
import * as db from '../store.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function initGenerator(opts = {}) {
  const docType = opts.docType || document.body.dataset.doctype || 'invoice';
  const dt = getDoctype(docType);
  const doc = blankDocument(docType);
  doc.number = `${dt.prefix}-001`;
  if (opts.preset) Object.assign(doc, opts.preset);

  const previewEl = $('#preview');
  let savedDocId = null;
  let renderQueued = false;

  // ---------- helpers ----------
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  const setPath = (obj, path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], obj)[last] = value;
  };

  function refresh() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      syncVisibility();
      renderItemAmounts();
      const layout = layoutDocument(doc, canvasMeasure);
      renderPreview(previewEl, layout);
      renderTotalsStrip(layout.totals);
    });
  }

  function renderTotalsStrip(totals) {
    const el = $('#totals-strip');
    if (!el) return;
    const money = (v) => formatMoney(v, doc.currency);
    el.innerHTML = '';
    const bits = [['Subtotal', money(totals.subtotal)]];
    if (totals.discountTotal > 0) bits.push(['Discount', `-${money(totals.discountTotal)}`]);
    if (totals.tax > 0) bits.push(['Tax', money(totals.tax)]);
    bits.push(['Total', money(totals.total)]);
    if (dt.hasBalance) bits.push(['Balance due', money(totals.balance)]);
    for (const [k, v] of bits) {
      const span = document.createElement('span');
      span.innerHTML = `<small>${k}</small><strong>${v}</strong>`;
      el.appendChild(span);
    }
  }

  // ---------- generic data-bind ----------
  // Push current doc state into every bound input (used at boot, after
  // loading a saved document, and after switching business).
  function syncForm() {
    for (const input of $$('[data-bind]')) {
      const initial = getPath(doc, input.dataset.bind);
      if (input.type === 'checkbox') input.checked = !!initial;
      else input.value = initial ?? '';
    }
  }

  function rebuildItems() {
    itemsBody.textContent = '';
    if (!doc.items.length) doc.items.push(blankItem());
    doc.items.forEach((it) => addItemRow(it));
  }

  for (const input of $$('[data-bind]')) {
    const path = input.dataset.bind;
    const initial = getPath(doc, path);
    if (input.type === 'checkbox') input.checked = !!initial;
    else if (initial !== undefined && initial !== null) input.value = initial;
    input.addEventListener('input', () => {
      let v = input.type === 'checkbox' ? input.checked : input.value;
      if (input.type === 'number' || input.dataset.number === '1') v = input.value === '' ? 0 : +input.value;
      setPath(doc, path, v);
      if (path === 'issueDate') applyTerms();
      refresh();
    });
  }

  // ---------- selects that need options ----------
  const currencySel = $('[data-bind="currency"]');
  if (currencySel) {
    currencySel.innerHTML = CURRENCIES.map(
      (c) => `<option value="${c.code}">${c.code} — ${c.name} (${c.symbol})</option>`
    ).join('');
    currencySel.value = doc.currency;
  }

  const templateSel = $('[data-bind="template"]');
  if (templateSel) {
    templateSel.innerHTML = TEMPLATES.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
    templateSel.value = doc.template;
  }

  const termsSel = $('#terms-preset');
  if (termsSel) {
    termsSel.innerHTML = TERMS_PRESETS.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
    termsSel.value = doc.termsPreset;
    termsSel.addEventListener('input', () => {
      doc.termsPreset = termsSel.value;
      applyTerms();
      refresh();
    });
  }

  function applyTerms() {
    const preset = TERMS_PRESETS.find((t) => t.id === doc.termsPreset);
    if (preset && preset.days !== null) {
      doc.dueDate = addDays(doc.issueDate, preset.days);
      const dueInput = $('[data-bind="dueDate"]');
      if (dueInput) dueInput.value = doc.dueDate;
    }
  }

  for (const sel of $$('select[data-states]')) {
    sel.innerHTML =
      '<option value="">— Select state —</option>' +
      IN_STATES.map(([code, name]) => `<option value="${code}">${code} — ${name}</option>`).join('');
  }

  // ---------- conditional sections ----------
  function syncVisibility() {
    const mode = doc.taxMode;
    toggle('#tax-single-fields', mode === 'single');
    toggle('#tax-gst-fields', mode === 'gst');
    document.body.classList.toggle('lines-tax', doc.showLineTax && mode === 'perline');
    document.body.classList.toggle('lines-disc', doc.showLineDiscount);
    const taxColToggle = $('#show-line-tax-wrap');
    if (taxColToggle) taxColToggle.hidden = mode !== 'perline';
    if (mode === 'perline') doc.showLineTax = true;
    const qtyHead = $('#col-qty-head');
    if (qtyHead) qtyHead.textContent = doc.itemMode === 'hours' ? 'Hours' : 'Qty';
  }
  const toggle = (sel, show) => { const el = $(sel); if (el) el.hidden = !show; };

  // ---------- items ----------
  const itemsBody = $('#items-body');

  function addItemRow(item, focus = false) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.draggable = true;
    row.innerHTML = `
      <button type="button" class="drag" title="Drag to reorder" aria-label="Reorder">⋮⋮</button>
      <textarea class="i-desc" rows="1" placeholder="Description of work or product"></textarea>
      <input class="i-qty" type="number" min="0" step="any" inputmode="decimal">
      <input class="i-rate" type="number" min="0" step="any" inputmode="decimal" placeholder="0.00">
      <input class="i-disc" type="number" min="0" max="100" step="any" inputmode="decimal" placeholder="%">
      <input class="i-tax" type="number" min="0" max="100" step="any" inputmode="decimal" placeholder="%">
      <output class="i-amount">0</output>
      <button type="button" class="i-save" title="Save to item catalog">☆</button>
      <button type="button" class="i-del" title="Remove line" aria-label="Remove">×</button>`;
    itemsBody.appendChild(row);

    const els = {
      desc: $('.i-desc', row), qty: $('.i-qty', row), rate: $('.i-rate', row),
      disc: $('.i-disc', row), tax: $('.i-tax', row),
    };
    els.desc.value = item.description;
    els.qty.value = item.qty;
    els.rate.value = item.rate || '';
    els.disc.value = item.discPct || '';
    els.tax.value = item.taxPct || '';

    const sync = () => {
      item.description = els.desc.value;
      item.qty = +els.qty.value || 0;
      item.rate = +els.rate.value || 0;
      item.discPct = +els.disc.value || 0;
      item.taxPct = +els.tax.value || 0;
      autoGrow(els.desc);
      refresh();
    };
    Object.values(els).forEach((el) => el.addEventListener('input', sync));

    $('.i-del', row).addEventListener('click', () => {
      const idx = doc.items.indexOf(item);
      if (idx > -1) doc.items.splice(idx, 1);
      row.remove();
      if (!doc.items.length) { doc.items.push(blankItem()); addItemRow(doc.items[0]); }
      refresh();
    });

    $('.i-save', row).addEventListener('click', async () => {
      if (!item.description) return flash('Add a description first.');
      await db.put('items', { id: db.uid('itm_'), description: item.description, rate: item.rate, taxPct: item.taxPct, hsn: item.hsn || '' });
      await loadCatalog();
      flash('Saved to your item catalog.');
    });

    // drag & drop reorder
    row.addEventListener('dragstart', (e) => {
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      doc.items = $$('.item-row', itemsBody).map((r) => r._item);
      refresh();
    });
    row._item = item;
    autoGrow(els.desc);
    if (focus) els.desc.focus();
  }

  itemsBody.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = $('.item-row.dragging', itemsBody);
    if (!dragging) return;
    const after = $$('.item-row:not(.dragging)', itemsBody).find(
      (r) => e.clientY < r.getBoundingClientRect().top + r.offsetHeight / 2
    );
    if (after) itemsBody.insertBefore(dragging, after);
    else itemsBody.appendChild(dragging);
  });

  function renderItemAmounts() {
    const totals = compute(doc);
    $$('.item-row', itemsBody).forEach((row, i) => {
      const out = $('.i-amount', row);
      if (out && totals.lines[i]) out.value = formatMoney(totals.lines[i].amount, doc.currency, { bare: true });
    });
  }

  function autoGrow(ta) {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }

  $('#add-item').addEventListener('click', () => {
    const item = blankItem();
    doc.items.push(item);
    addItemRow(item, true);
    refresh();
  });

  doc.items.forEach((it) => addItemRow(it));

  // catalog
  async function loadCatalog() {
    const items = await db.all('items');
    const sel = $('#catalog-select');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">+ Add from saved items…</option>' +
      items.map((i) => `<option value="${i.id}">${esc(i.description.slice(0, 60))} — ${i.rate}</option>`).join('');
    sel.onchange = () => {
      const hit = items.find((i) => i.id === sel.value);
      if (!hit) return;
      const item = { ...blankItem(), description: hit.description, rate: hit.rate, taxPct: hit.taxPct || 0, hsn: hit.hsn || '' };
      doc.items.push(item);
      addItemRow(item);
      sel.value = '';
      refresh();
    };
  }

  // ---------- logo & signature ----------
  bindImageInput('#logo-input', '#logo-clear', (dataUrl) => { doc.business.logo = dataUrl; refresh(); });
  bindImageInput('#sig-upload', '#sig-clear', (dataUrl) => { doc.signature = dataUrl; refresh(); });

  function bindImageInput(inputSel, clearSel, set) {
    const input = $(inputSel);
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return flash('Please use an image under 2 MB.');
      const reader = new FileReader();
      reader.onload = () => set(reader.result);
      reader.readAsDataURL(file);
    });
    const clear = $(clearSel);
    if (clear) clear.addEventListener('click', () => { set(''); input.value = ''; });
  }

  // signature pad
  const sigModal = $('#sig-modal');
  if (sigModal) {
    const canvas = $('#sig-canvas');
    const sctx = canvas.getContext('2d');
    let drawing = false;
    let drew = false;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return [(p.clientX - r.left) * (canvas.width / r.width), (p.clientY - r.top) * (canvas.height / r.height)];
    };
    const start = (e) => { drawing = true; drew = true; sctx.beginPath(); sctx.moveTo(...pos(e)); e.preventDefault(); };
    const move = (e) => {
      if (!drawing) return;
      sctx.lineTo(...pos(e));
      sctx.strokeStyle = '#11233f';
      sctx.lineWidth = 2.2;
      sctx.lineCap = 'round';
      sctx.stroke();
      e.preventDefault();
    };
    const end = () => { drawing = false; };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    $('#sig-open').addEventListener('click', () => { sigModal.showModal(); });
    $('#sig-clear-pad').addEventListener('click', () => { sctx.clearRect(0, 0, canvas.width, canvas.height); drew = false; });
    $('#sig-use').addEventListener('click', () => {
      if (drew) { doc.signature = canvas.toDataURL('image/png'); refresh(); }
      sigModal.close();
    });
    $('#sig-cancel').addEventListener('click', () => sigModal.close());
  }

  // ---------- clients ----------
  async function loadClients() {
    const clients = await db.all('clients');
    const sel = $('#client-select');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">Load saved client…</option>' +
      clients.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    sel.onchange = () => {
      const hit = clients.find((c) => c.id === sel.value);
      if (!hit) return;
      Object.assign(doc.client, { name: hit.name, address: hit.address, email: hit.email, phone: hit.phone, gstin: hit.gstin || '', state: hit.state || '' });
      for (const k of ['name', 'address', 'email', 'phone', 'gstin']) {
        const el = $(`[data-bind="client.${k}"]`);
        if (el) el.value = doc.client[k] || '';
      }
      refresh();
    };
  }

  $('#client-save').addEventListener('click', async () => {
    if (!doc.client.name) return flash('Enter a client name first.');
    const clients = await db.all('clients');
    const existing = clients.find((c) => c.name.trim().toLowerCase() === doc.client.name.trim().toLowerCase());
    await db.put('clients', { id: existing ? existing.id : db.uid('cli_'), ...doc.client });
    await loadClients();
    flash(`Client “${doc.client.name}” saved on this device.`);
  });

  // ---------- snippets ----------
  async function loadSnippets() {
    const snippets = await db.all('snippets');
    for (const kind of ['notes', 'terms']) {
      const sel = $(`#snippet-${kind}`);
      if (!sel) continue;
      const mine = snippets.filter((s) => s.kind === kind);
      sel.innerHTML =
        '<option value="">Insert saved…</option>' +
        mine.map((s) => `<option value="${s.id}">${esc(s.title)}</option>`).join('');
      sel.onchange = () => {
        const hit = mine.find((s) => s.id === sel.value);
        if (!hit) return;
        doc[kind] = doc[kind] ? `${doc[kind]}\n${hit.text}` : hit.text;
        const ta = $(`[data-bind="${kind}"]`);
        if (ta) ta.value = doc[kind];
        sel.value = '';
        refresh();
      };
    }
  }
  for (const kind of ['notes', 'terms']) {
    const btn = $(`#save-snippet-${kind}`);
    if (btn) btn.addEventListener('click', async () => {
      const text = doc[kind];
      if (!text) return flash('Nothing to save yet.');
      const title = text.split('\n')[0].slice(0, 48);
      await db.put('snippets', { id: db.uid('snp_'), kind, title, text });
      await loadSnippets();
      flash('Snippet saved.');
    });
  }

  // ---------- multi-business profiles + per-business numbering ----------
  let activeBiz = null;
  let loadedFromWorkspace = false;

  async function ensureBusinesses() {
    let list = await db.all('businesses');
    if (!list.length) {
      // Migrate the pre-multi-business single profile, if any.
      const legacy = (await db.getSetting('defaultBusiness')) || {};
      const legacySeq = await db.getSetting(`seq:${docType}`);
      const biz = {
        id: db.uid('biz_'),
        name: legacy.name || 'My business',
        logo: legacy.logo || '', address: legacy.address || '', email: legacy.email || '',
        phone: legacy.phone || '', taxLabel: legacy.taxLabel || 'Tax ID', taxValue: legacy.taxValue || '',
        sequences: legacySeq ? { [docType]: legacySeq } : {},
        defaults: {},
      };
      await db.put('businesses', biz);
      list = [biz];
    }
    return list;
  }

  function bizSeq() {
    if (!activeBiz.sequences) activeBiz.sequences = {};
    if (!activeBiz.sequences[docType]) activeBiz.sequences[docType] = defaultSequence(dt.prefix);
    return activeBiz.sequences[docType];
  }

  function applyBusinessToDoc() {
    Object.assign(doc.business, {
      name: activeBiz.name === 'My business' && !activeBiz.address ? doc.business.name || activeBiz.name : activeBiz.name,
      logo: activeBiz.logo || '', address: activeBiz.address || '', email: activeBiz.email || '',
      phone: activeBiz.phone || '', taxLabel: activeBiz.taxLabel || 'Tax ID', taxValue: activeBiz.taxValue || '',
    });
    if (activeBiz.defaults) {
      if (activeBiz.defaults.currency) doc.currency = activeBiz.defaults.currency;
      if (activeBiz.defaults.template) doc.template = activeBiz.defaults.template;
    }
  }

  async function initBusinesses() {
    const list = await ensureBusinesses();
    const activeId = await db.getSetting('activeBusinessId');
    activeBiz = list.find((b) => b.id === activeId) || list[0];

    const sel = $('#business-select');
    if (sel) {
      const wrap = $('#business-select-wrap');
      if (wrap && list.length < 2) wrap.hidden = true;
      sel.innerHTML = list.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
      sel.value = activeBiz.id;
      sel.onchange = async () => {
        activeBiz = list.find((b) => b.id === sel.value) || activeBiz;
        await db.setSetting('activeBusinessId', activeBiz.id);
        if (!loadedFromWorkspace) applyBusinessToDoc();
        else Object.assign(doc.business, { logo: activeBiz.logo });
        applyNumber();
        syncForm();
        refresh();
      };
    }

    if (!loadedFromWorkspace) applyBusinessToDoc();

    // Edits to "Your business" persist into the active profile.
    let t = null;
    for (const input of $$('[data-bind^="business."]')) {
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          Object.assign(activeBiz, {
            name: doc.business.name, address: doc.business.address, email: doc.business.email,
            phone: doc.business.phone, taxLabel: doc.business.taxLabel, taxValue: doc.business.taxValue,
            logo: doc.business.logo,
          });
          db.put('businesses', activeBiz);
        }, 600);
      });
    }
  }

  function applyNumber() {
    if (loadedFromWorkspace) return; // keep the stored number when editing
    const seq = bizSeq();
    doc.number = buildNumber(seq, doc.issueDate);
    const el = $('[data-bind="number"]');
    if (el) el.value = doc.number;
    refresh();
  }

  function initNumbering() {
    const seq = bizSeq();
    const fmtSel = $('#num-format');
    if (fmtSel) {
      fmtSel.innerHTML = NUMBER_FORMATS.map((f) => `<option value="${f.id}">${f.label}</option>`).join('');
      fmtSel.value = seq.format;
      fmtSel.onchange = async () => { seq.format = fmtSel.value; await db.put('businesses', activeBiz); applyNumber(); };
    }
    const prefixInput = $('#num-prefix');
    if (prefixInput) {
      prefixInput.value = seq.prefix;
      prefixInput.oninput = async () => { seq.prefix = prefixInput.value || dt.prefix; await db.put('businesses', activeBiz); applyNumber(); };
    }
    applyNumber();
    window.__bumpSequence = async () => {
      // Only advance the sequence when this document consumed the next number.
      if (doc.number === buildNumber(seq, doc.issueDate)) {
        seq.next = (seq.next || 1) + 1;
        await db.put('businesses', activeBiz);
      }
    };
  }

  // ---------- load a saved document for editing (?doc=<id>) ----------
  async function loadFromWorkspace() {
    const id = new URLSearchParams(location.search).get('doc');
    if (!id) return;
    const rec = await db.get('documents', id);
    if (!rec || !rec.state) return;
    savedDocId = rec.id;
    loadedFromWorkspace = true;
    const state = rec.state;
    for (const key of Object.keys(doc)) {
      if (key in state) doc[key] = state[key];
    }
    doc.ledger = rec.ledger || doc.ledger || [];
    rebuildItems();
    syncForm();
  }

  // ---------- actions ----------
  $('#download-pdf').addEventListener('click', async () => {
    const btn = $('#download-pdf');
    btn.disabled = true;
    btn.textContent = 'Preparing PDF…';
    try {
      const bytes = await renderPDF(doc);
      const name = `${dt.fileLabel}-${doc.number.replace(/[^\w.-]+/g, '-')}.pdf`;
      db.downloadBlob(new Blob([bytes], { type: 'application/pdf' }), name);
      await saveToWorkspace('Sent');
    } catch (err) {
      console.error(err);
      flash('Sorry — the PDF could not be generated. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Download PDF';
    }
  });

  const saveBtn = $('#save-doc');
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    await saveToWorkspace('Draft');
    flash('Saved to your workspace — find it under Dashboard. It never leaves this device.');
  });

  async function saveToWorkspace(status) {
    const totals = compute(doc);
    const existing = savedDocId ? await db.get('documents', savedDocId) : null;
    savedDocId = savedDocId || db.uid('doc_');
    await db.put('documents', {
      id: savedDocId,
      docType: doc.docType,
      businessId: activeBiz ? activeBiz.id : '',
      number: doc.number,
      status: existing && existing.status === 'Paid' ? 'Paid' : status,
      issueDate: doc.issueDate,
      dueDate: doc.dueDate,
      clientName: doc.client.name,
      currency: doc.currency,
      total: totals.total,
      balance: totals.balance,
      ledger: doc.ledger,
      updatedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(doc)),
    });
    // Consuming a number advances the per-business sequence (no-op when
    // re-saving, since the doc's number no longer matches the next build).
    await window.__bumpSequence?.();
  }

  // ---------- mobile tabs ----------
  for (const tab of $$('.gen-tab')) {
    tab.addEventListener('click', () => {
      $$('.gen-tab').forEach((b) => b.classList.toggle('active', b === tab));
      document.body.classList.toggle('show-preview', tab.dataset.tab === 'preview');
      fitPreview(previewEl);
    });
  }
  window.addEventListener('resize', () => fitPreview(previewEl));

  // ---------- toast ----------
  function flash(msg) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // ---------- boot ----------
  (async () => {
    await loadFromWorkspace();
    await initBusinesses();
    initNumbering();
    await Promise.all([loadClients(), loadCatalog(), loadSnippets()]);
    if (!loadedFromWorkspace) applyTerms();
    syncForm();
    refresh();
  })();

  return { doc, refresh };
}
