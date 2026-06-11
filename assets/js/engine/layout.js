// The layout engine. Turns (document state + computed totals + template) into
// pages of drawing primitives. Both the live HTML preview and the pdf-lib PDF
// renderer consume the SAME primitives, so the preview is PDF-faithful by
// construction. Text measurement is injected (canvas in preview, pdf-lib font
// metrics in the PDF) — wrapping logic is shared.
//
// Coordinates: points, origin top-left. Text y = top of the line box.
// Primitives:
//   {t:'text', x, y, size, font, color, text, align?, lineH?}
//   {t:'rect', x, y, w, h, fill?, stroke?, lineW?}
//   {t:'line', x1, y1, x2, y2, color, w}
//   {t:'image', x, y, w, h, src}    src = dataURL

import { template as getTemplate } from './templates.js';
import { doctype as getDoctype } from './doctypes.js';
import { compute } from './model.js';
import { formatMoney } from '../util/money.js';
import { formatDate } from '../util/dates.js';
import { amountInWords } from '../util/words.js';
import { L } from './labels.js';
import { currency } from '../util/money.js';

export const PAGE_SIZES = {
  a4: { w: 595.28, h: 841.89, label: 'A4' },
  letter: { w: 612, h: 792, label: 'Letter' },
};

export const COLORS = {
  ink: '#11233f',
  body: '#2c3a52',
  muted: '#6b7689',
  faint: '#9aa3b2',
  gold: '#c8a24b',
  hairline: '#d8d3c6',
  zebra: '#f4f2ec',
  white: '#ffffff',
  emerald: '#0e6b4f',
};

const MARGIN = 48;

// Font keys understood by both renderers.
// heading/body resolve per template + user serif/sans pairing.
function resolveFonts(doc, tpl) {
  const pair = tpl.font === 'inherit' ? doc.fontPair : tpl.font;
  if (pair === 'mono') return { head: 'courB', headLight: 'cour', body: 'cour', bodyB: 'courB', bodyI: 'cour' };
  if (pair === 'serif') return { head: 'timesB', headLight: 'times', body: 'helv', bodyB: 'helvB', bodyI: 'helvO' };
  return { head: 'helvB', headLight: 'helv', body: 'helv', bodyB: 'helvB', bodyI: 'helvO' };
}

function wrap(text, font, size, maxW, measure) {
  const out = [];
  for (const rawLine of String(text ?? '').split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = '';
    for (const word of words) {
      const probe = line ? `${line} ${word}` : word;
      if (measure(probe, font, size) <= maxW || !line) line = probe;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out.length ? out : [''];
}

export function layoutDocument(doc, measure) {
  const tpl = getTemplate(doc.template);
  const dt = getDoctype(doc.docType);
  const totals = compute(doc);
  const page = PAGE_SIZES[doc.pageSize] || PAGE_SIZES.a4;
  const F = resolveFonts(doc, tpl);
  const lang = doc.language || 'en';
  const t = (key) => L(lang, key);
  const d = tpl.density;
  const brand = doc.brandColor || COLORS.ink;
  const money = (v) => formatMoney(v, doc.currency, { pdfSafe: true });
  const date = (iso) => formatDate(iso, currency(doc.currency).locale);

  const W = page.w;
  const H = page.h;
  const left = MARGIN + (tpl.sideRail ? 14 : 0);
  const right = W - MARGIN;
  const contentW = right - left;
  const footerY = H - MARGIN + 14;

  const pages = [];
  let prims = null;
  let y = 0;

  function newPage() {
    prims = [];
    pages.push({ w: W, h: H, prims });
    if (tpl.sideRail) prims.push({ t: 'rect', x: 0, y: 0, w: 14, h: H, fill: brand });
    if (tpl.band && !tpl.band.contentInBand && pages.length === 1) {
      prims.push({ t: 'rect', x: 0, y: 0, w: W, h: tpl.band.h, fill: brand });
    }
    y = MARGIN + (tpl.band && !tpl.band.contentInBand && pages.length === 1 ? tpl.band.h : 0);
  }

  function ensure(h) {
    if (y + h > H - MARGIN - 10) newPage();
  }

  function text(str, x, yy, size, font, color, align = 'left') {
    prims.push({ t: 'text', x, y: yy, size, font, color, text: String(str), align });
  }

  // Wrapped paragraph; returns height consumed.
  function para(str, x, yy, size, font, color, maxW, lineH) {
    const lh = lineH || size * 1.35;
    const lines = wrap(str, font, size, maxW, measure);
    lines.forEach((ln, i) => text(ln, x, yy + i * lh, size, font, color));
    return lines.length * lh;
  }

  newPage();

  // ---------- HEADER ----------
  const title = (doc.title || t(dt.titleKey));
  const titleText = tpl.titleCaps ? title.toUpperCase() : title;
  const inBand = tpl.band && tpl.band.contentInBand;
  const headInk = inBand ? COLORS.white : COLORS.ink;
  const headMuted = inBand ? '#ffffffcc' : COLORS.muted;

  if (inBand) {
    prims.push({ t: 'rect', x: 0, y: 0, w: W, h: tpl.band.h, fill: brand });
    y = 30;
  }

  const headTop = y;
  let leftY = headTop;
  let rightY = headTop;

  if (tpl.centeredHeader) {
    // Business block centered, title centered beneath, meta row after.
    if (doc.business.logo) {
      prims.push({ t: 'image', x: W / 2 - 24, y: leftY, w: 48, h: 48, src: doc.business.logo });
      leftY += 56;
    }
    if (doc.business.name) {
      text(doc.business.name, W / 2, leftY, 15, F.head, headInk, 'center');
      leftY += 20;
    }
    const bizMeta = [doc.business.address.replace(/\n/g, ', '), [doc.business.email, doc.business.phone].filter(Boolean).join('  ·  '),
      doc.business.taxValue ? `${doc.business.taxLabel}: ${doc.business.taxValue}` : '']
      .filter(Boolean);
    for (const lineStr of bizMeta) {
      const lines = wrap(lineStr, F.body, 8.5, contentW, measure);
      lines.forEach((ln) => { text(ln, W / 2, leftY, 8.5, F.body, headMuted, 'center'); leftY += 12; });
    }
    leftY += 8;
    if (tpl.goldRules) {
      prims.push({ t: 'line', x1: left, y1: leftY, x2: right, y2: leftY, color: COLORS.gold, w: 0.7 });
      leftY += 14;
    }
    text(titleText, W / 2, leftY, tpl.titleSize, F.head, headInk, 'center');
    leftY += tpl.titleSize * 1.25;
    const metaBits = [`${t('number')} ${doc.number}`, `${t('issueDate')}: ${date(doc.issueDate)}`];
    if (dt.hasDueDate && doc.dueDate) metaBits.push(`${t('dueDate')}: ${date(doc.dueDate)}`);
    if (doc.poRef) metaBits.push(`${t('poRef')}: ${doc.poRef}`);
    text(metaBits.join('    ·    '), W / 2, leftY, 9, F.body, headMuted, 'center');
    leftY += 16;
    y = leftY;
  } else {
    // Left: logo + business. Right: title + number/date stack.
    if (doc.business.logo) {
      prims.push({ t: 'image', x: left, y: leftY, w: 56, h: 56, src: doc.business.logo });
      leftY += 64;
    }
    if (doc.business.name) {
      text(doc.business.name, left, leftY, 14, F.head, headInk);
      leftY += 18;
    }
    const bizLines = [
      ...String(doc.business.address || '').split('\n').filter(Boolean),
      [doc.business.email, doc.business.phone].filter(Boolean).join('  ·  '),
      doc.business.taxValue ? `${doc.business.taxLabel}: ${doc.business.taxValue}` : '',
    ].filter(Boolean);
    for (const lineStr of bizLines) {
      const lines = wrap(lineStr, F.body, 9, contentW * 0.52, measure);
      lines.forEach((ln) => { text(ln, left, leftY, 9, F.body, headMuted); leftY += 13; });
    }

    text(titleText, right, rightY, tpl.titleSize, F.head, inBand ? COLORS.white : (tpl.id === 'creative' ? brand : COLORS.ink), 'right');
    rightY += tpl.titleSize * 1.3;
    const metaPairs = [[t('number'), doc.number], [t('issueDate'), date(doc.issueDate)]];
    if (dt.hasDueDate && doc.dueDate) metaPairs.push([t('dueDate'), date(doc.dueDate)]);
    if (doc.poRef) metaPairs.push([t('poRef'), doc.poRef]);
    for (const [k, v] of metaPairs) {
      text(`${tpl.labelCaps ? k.toUpperCase() : k}  ${v}`, right, rightY, 9, F.body, headMuted, 'right');
      rightY += 13.5;
    }
    y = Math.max(leftY, rightY, inBand ? tpl.band.h + 18 : 0) + 16 * d;

    if (tpl.goldRules) {
      prims.push({ t: 'line', x1: left, y1: y - 8, x2: right, y2: y - 8, color: COLORS.gold, w: 0.7 });
    } else if (tpl.doubleRules) {
      prims.push({ t: 'line', x1: left, y1: y - 10, x2: right, y2: y - 10, color: COLORS.ink, w: 1.1 });
      prims.push({ t: 'line', x1: left, y1: y - 7, x2: right, y2: y - 7, color: COLORS.ink, w: 0.4 });
    }
  }

  // ---------- PARTIES (Bill To) + GST fields ----------
  ensure(80);
  const partyTop = y;
  let pY = partyTop;
  const partyLabel = tpl.labelCaps ? t(dt.partyLabel).toUpperCase() : t(dt.partyLabel);
  text(partyLabel, left, pY, 8.5, F.bodyB, COLORS.faint);
  pY += 14;
  if (doc.client.name) { text(doc.client.name, left, pY, 11.5, F.bodyB, COLORS.ink); pY += 16; }
  const clientLines = [
    ...String(doc.client.address || '').split('\n').filter(Boolean),
    [doc.client.email, doc.client.phone].filter(Boolean).join('  ·  '),
  ].filter(Boolean);
  for (const lineStr of clientLines) {
    const lines = wrap(lineStr, F.body, 9.5, contentW * 0.55, measure);
    lines.forEach((ln) => { text(ln, left, pY, 9.5, F.body, COLORS.body); pY += 13.5; });
  }

  // GST block (right side of parties zone)
  let gY = partyTop;
  if (doc.taxMode === 'gst') {
    const gstPairs = [];
    if (doc.gst.sellerGstin) gstPairs.push([`${t('gstin')} (${t('from')})`, doc.gst.sellerGstin]);
    if (doc.client.gstin || doc.gst.buyerGstin) gstPairs.push([`${t('gstin')} (${t('billTo')})`, doc.client.gstin || doc.gst.buyerGstin]);
    if (doc.gst.supplyState) gstPairs.push([t('placeOfSupply'), doc.gst.supplyState]);
    for (const [k, v] of gstPairs) {
      text(`${k}:  ${v}`, right, gY, 9, F.body, COLORS.body, 'right');
      gY += 13.5;
    }
  }
  y = Math.max(pY, gY) + 18 * d;

  // ---------- ITEMS TABLE ----------
  const cols = buildColumns(doc, dt, t, contentW, left);
  const thSize = 8.5;
  const tdSize = 9.5;
  const rowPadY = 7 * d;

  function colX(col) {
    // returns x for text within the column based on its alignment
    return col.align === 'right' ? col.x + col.w : col.x;
  }

  function drawTableHead() {
    const hh = 22 * d;
    ensure(hh + 30);
    const fill = tpl.table.headFill === 'brand' ? brand : tpl.table.headFill === 'ink' ? COLORS.ink : null;
    if (fill) prims.push({ t: 'rect', x: left, y: y - 6, w: contentW, h: hh, fill });
    const headColor = fill ? COLORS.white : COLORS.faint;
    const ty = y + (fill ? 5 : 2);
    for (const col of cols) {
      text(tpl.labelCaps ? col.label.toUpperCase() : col.label, colX(col), ty, thSize, F.bodyB, headColor, col.align);
    }
    y += hh - (fill ? 4 : 2);
    if (!fill) {
      prims.push({ t: 'line', x1: left, y1: y - 2, x2: right, y2: y - 2, color: tpl.boxedTable ? COLORS.ink : COLORS.ink, w: tpl.boxedTable ? 0.8 : 0.9 });
    }
    y += 6 * d;
  }

  drawTableHead();
  const tableTopY = y;

  doc.items.forEach((it, idx) => {
    const line = totals.lines[idx];
    const descCol = cols.find((c) => c.id === 'desc');
    const descLines = wrap(it.description || ' ', F.body, tdSize, descCol.w - 4, measure);
    const rowH = Math.max(descLines.length, 1) * tdSize * 1.4 + rowPadY * 2;

    if (y + rowH > H - MARGIN - 14) {
      newPage();
      drawTableHead();
    }

    if (tpl.table.zebra && idx % 2 === 1) {
      prims.push({ t: 'rect', x: left, y: y - rowPadY + 2, w: contentW, h: rowH, fill: COLORS.zebra });
    }

    const baseY = y + 2;
    for (const col of cols) {
      let v = '';
      switch (col.id) {
        case 'idx': v = String(idx + 1); break;
        case 'desc': break; // handled below (multi-line)
        case 'hsn': v = it.hsn || ''; break;
        case 'qty': v = formatQty(it.qty); break;
        case 'rate': v = money(+it.rate || 0); break;
        case 'disc': v = it.discPct ? `${+it.discPct}%` : '—'; break;
        case 'tax': v = it.taxPct ? `${+it.taxPct}%` : '—'; break;
        case 'amount': v = money(line.amount); break;
      }
      if (col.id === 'desc') {
        descLines.forEach((ln, i) => text(ln, col.x, baseY + i * tdSize * 1.4, tdSize, F.body, COLORS.ink));
      } else if (v) {
        text(v, colX(col), baseY, tdSize, F.body, col.id === 'amount' ? COLORS.ink : COLORS.body, col.align);
      }
    }
    y += rowH;
    if (tpl.table.rowRule) {
      prims.push({ t: 'line', x1: left, y1: y - rowPadY + 2, x2: right, y2: y - rowPadY + 2, color: COLORS.hairline, w: 0.5 });
    }
  });

  if (tpl.boxedTable) {
    // full grid: outer box + column separators down the table body
    const boxTop = tableTopY - 30 * d;
    prims.push({ t: 'rect', x: left, y: boxTop, w: contentW, h: y - boxTop - rowPadY + 4, stroke: COLORS.ink, lineW: 0.8 });
    for (let i = 1; i < cols.length; i++) {
      const cx = cols[i].x - 6;
      prims.push({ t: 'line', x1: cx, y1: boxTop, x2: cx, y2: y - rowPadY + 4, color: COLORS.hairline, w: 0.5 });
    }
  }

  y += 10 * d;

  // ---------- TOTALS (right) + WORDS/NOTES/PAYMENT (left) ----------
  const totalsRows = buildTotalsRows(doc, dt, totals, t, money);
  const totalsH = totalsRows.length * 17 * d + 30;
  ensure(Math.min(totalsH + 40, H - 2 * MARGIN));

  const totW = 230;
  const totX = right - totW;
  let tY = y;
  for (const row of totalsRows) {
    if (row.emphasis) {
      const bandH = 24 * d;
      prims.push({ t: 'rect', x: totX - 8, y: tY - 6, w: totW + 8, h: bandH, fill: tpl.table.headFill === 'ink' ? COLORS.ink : brand });
      text(tpl.labelCaps ? row.label.toUpperCase() : row.label, totX, tY, 9.5, F.bodyB, COLORS.white);
      text(row.value, right - 2, tY, 11, F.bodyB, COLORS.white, 'right');
      tY += bandH + 4;
    } else {
      text(row.label, totX, tY, 9.5, row.bold ? F.bodyB : F.body, row.bold ? COLORS.ink : COLORS.muted);
      text(row.value, right - 2, tY, 9.5, row.bold ? F.bodyB : F.body, row.bold ? COLORS.ink : COLORS.body, 'right');
      tY += 17 * d;
      if (row.ruleAfter) {
        prims.push({ t: 'line', x1: totX, y1: tY - 5, x2: right, y2: tY - 5, color: tpl.goldRules ? COLORS.gold : COLORS.hairline, w: 0.7 });
        tY += 3;
      }
    }
  }

  // Left column: amount in words, notes, terms, payment details
  let lY = y;
  const leftColW = contentW - totW - 30;
  if (doc.wordsMode !== 'off' && totals.total > 0) {
    const words = amountInWords(totals.total, doc.currency, doc.wordsMode);
    text(tpl.labelCaps ? t('amountInWords').toUpperCase() : t('amountInWords'), left, lY, 8, F.bodyB, COLORS.faint);
    lY += 12;
    lY += para(words, left, lY, 9, F.bodyI, COLORS.body, leftColW);
    lY += 10 * d;
  }

  function block(labelKey, body, size = 9) {
    if (!body) return;
    if (lY > H - MARGIN - 60) { /* flow into full width below totals if needed */ }
    text(tpl.labelCaps ? t(labelKey).toUpperCase() : t(labelKey), left, lY, 8, F.bodyB, COLORS.faint);
    lY += 12;
    lY += para(body, left, lY, size, F.body, COLORS.body, leftColW);
    lY += 10 * d;
  }

  block('notes', doc.notes);
  block('terms', doc.terms);

  if (dt.hasPayment) {
    const payLines = [];
    if (doc.payment.bank) payLines.push(doc.payment.bank);
    if (doc.payment.paypal) payLines.push(`PayPal: ${doc.payment.paypal}`);
    if (doc.payment.upiId) payLines.push(`UPI: ${doc.payment.upiId}`);
    if (payLines.length) block('paymentDetails', payLines.join('\n'));
  }

  // Ledger printed on document (optional)
  if (doc.showLedgerOnDoc && (doc.ledger || []).length) {
    text(tpl.labelCaps ? t('paymentsRecorded').toUpperCase() : t('paymentsRecorded'), left, lY, 8, F.bodyB, COLORS.faint);
    lY += 13;
    for (const p of doc.ledger) {
      text(`${date(p.date)}   ${money(+p.amount || 0)}${p.note ? `   ${p.note}` : ''}`, left, lY, 9, F.body, COLORS.body);
      lY += 13;
    }
    lY += 10 * d;
  }

  y = Math.max(lY, tY) + 14 * d;

  // ---------- SIGNATURE ----------
  if (doc.signature) {
    ensure(80);
    prims.push({ t: 'image', x: right - 150, y, w: 150, h: 50, src: doc.signature });
    y += 56;
    prims.push({ t: 'line', x1: right - 160, y1: y, x2: right, y2: y, color: COLORS.hairline, w: 0.7 });
    y += 6;
    text(doc.signatureLabel || t('signature'), right - 80, y, 8.5, F.body, COLORS.muted, 'center');
    y += 16;
  }

  // ---------- FOOTER: page numbers ----------
  if (pages.length > 1) {
    pages.forEach((pg, i) => {
      pg.prims.push({
        t: 'text', x: W / 2, y: footerY, size: 8, font: F.body, color: COLORS.faint,
        text: `${t('page')} ${i + 1} ${t('of')} ${pages.length}`, align: 'center',
      });
    });
  }

  return { pages, totals, template: tpl, doctype: dt };
}

function formatQty(q) {
  const n = +q || 0;
  return Number.isInteger(n) ? String(n) : String(n.toFixed(2)).replace(/\.?0+$/, '');
}

function buildColumns(doc, dt, t, contentW, left) {
  const cols = [];
  const qtyLabel = doc.itemMode === 'hours' ? t('hours') : t('qty');
  const defs = [
    { id: 'idx', label: '#', w: 20, align: 'left' },
    { id: 'desc', label: t('description'), w: 0, align: 'left' }, // flex
    ...(doc.taxMode === 'gst' ? [{ id: 'hsn', label: t('hsn'), w: 52, align: 'left' }] : []),
    { id: 'qty', label: qtyLabel, w: 42, align: 'right' },
    { id: 'rate', label: t('rate'), w: 66, align: 'right' },
    ...(doc.showLineDiscount ? [{ id: 'disc', label: t('disc'), w: 40, align: 'right' }] : []),
    ...(doc.showLineTax ? [{ id: 'tax', label: t('tax'), w: 40, align: 'right' }] : []),
    { id: 'amount', label: t('amount'), w: 76, align: 'right' },
  ];
  const fixed = defs.reduce((s, c) => s + c.w, 0);
  const gap = 10;
  const flexW = contentW - fixed - gap * (defs.length - 1);
  let x = left;
  for (const def of defs) {
    const w = def.id === 'desc' ? flexW : def.w;
    cols.push({ ...def, x, w });
    x += w + gap;
  }
  return cols;
}

function buildTotalsRows(doc, dt, totals, t, money) {
  const rows = [];
  rows.push({ label: t('subtotal'), value: money(totals.subtotal) });
  if (totals.discountTotal > 0) {
    const suffix = doc.discount.type === 'pct' ? ` (${+doc.discount.value}%)` : '';
    rows.push({ label: `${t('discount')}${suffix}`, value: `-${money(totals.discountTotal)}` });
    rows.push({ label: t('taxableValue'), value: money(totals.taxable) });
  }
  if (doc.taxMode === 'gst' && totals.gstSplit) {
    const g = totals.gstSplit;
    if (g.interstate) {
      rows.push({ label: `${t('igst')} (${g.rate}%)`, value: money(g.igst) });
    } else {
      rows.push({ label: `${t('cgst')} (${g.rate / 2}%)`, value: money(g.cgst) });
      rows.push({ label: `${t('sgst')} (${g.rate / 2}%)`, value: money(g.sgst) });
    }
  } else if (totals.tax > 0) {
    const label = doc.taxMode === 'single' ? `${doc.taxLabel || t('tax')} (${+doc.taxPct}%)` : (doc.taxLabel || 'Tax');
    rows.push({ label, value: money(totals.tax) });
  }
  if (totals.shipping > 0) rows.push({ label: t('shipping'), value: money(totals.shipping) });
  if (totals.tip > 0) rows.push({ label: t('tip'), value: money(totals.tip) });
  rows.push({ label: t('total'), value: money(totals.total), bold: true, ruleAfter: true });
  if (dt.hasBalance && totals.paid > 0) {
    rows.push({ label: t('amountPaid'), value: `-${money(totals.paid)}` });
  }
  if (dt.hasBalance) {
    rows.push({ label: t('balanceDue'), value: money(totals.balance), emphasis: true });
  } else if (!rows.some((r) => r.emphasis)) {
    rows[rows.length - 1] = { ...rows[rows.length - 1], emphasis: true, ruleAfter: false };
  }
  return rows;
}
