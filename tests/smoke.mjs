// Node smoke test for the pure engine modules: math, words, numbering, layout.
// Run: node tests/smoke.mjs

import { compute, blankDocument, blankItem } from '../assets/js/engine/model.js';
import { amountInWords, westernWords, indianWords } from '../assets/js/util/words.js';
import { formatMoney, roundMoney } from '../assets/js/util/money.js';
import { buildNumber } from '../assets/js/util/numbering.js';
import { fyIndia, addDays } from '../assets/js/util/dates.js';
import { layoutDocument } from '../assets/js/engine/layout.js';

let failures = 0;
function eq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok   ${label}`);
  }
}

// ---- words ----
eq(westernWords(1234567), 'One Million Two Hundred Thirty-Four Thousand Five Hundred Sixty-Seven', 'western words 1,234,567');
eq(indianWords(1234567), 'Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven', 'indian words 12,34,567');
eq(indianWords(123456789), 'Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine', 'indian words 12,34,56,789');
eq(amountInWords(1234.56, 'INR', 'indian'), 'One Thousand Two Hundred Thirty-Four Rupees and Fifty-Six Paise Only', 'amount in words INR');
eq(amountInWords(1, 'USD', 'western'), 'One Dollar Only', 'singular dollar');
eq(amountInWords(0.5, 'USD', 'western'), 'Zero Dollars and Fifty Cents Only', 'cents only');

// ---- numbering / FY ----
eq(fyIndia('2026-06-11'), '2026-27', 'FY for June 2026');
eq(fyIndia('2026-02-11'), '2025-26', 'FY for Feb 2026');
eq(buildNumber({ prefix: 'INV', format: 'fy-india', next: 1, pad: 3 }, '2026-06-11'), 'INV/2026-27/001', 'FY number format');
eq(buildNumber({ prefix: 'INV', format: 'plain', next: 42, pad: 3 }, '2026-06-11'), 'INV-042', 'plain number format');
eq(addDays('2026-01-30', 30), '2026-03-01', 'addDays across month');

// ---- money ----
eq(roundMoney(0.1 + 0.2, 'USD'), 0.3, 'float rounding');
eq(formatMoney(1234.5, 'USD'), '$1,234.50', 'USD format');
eq(formatMoney(1234567.89, 'INR'), '₹12,34,567.89', 'INR lakh grouping');
eq(formatMoney(1234567.89, 'INR', { pdfSafe: true }), 'Rs. 12,34,567.89', 'INR pdf-safe symbol');

// ---- compute: basic ----
{
  const doc = blankDocument('invoice');
  doc.items = [
    { ...blankItem(), description: 'Design', qty: 10, rate: 100 },
    { ...blankItem(), description: 'Dev', qty: 5, rate: 200 },
  ];
  doc.discount = { type: 'pct', value: 10 };
  doc.taxMode = 'single';
  doc.taxPct = 20;
  doc.shipping = 50;
  doc.amountPaid = 500;
  const t = compute(doc);
  eq(t.subtotal, 2000, 'subtotal');
  eq(t.discountTotal, 200, 'discount 10%');
  eq(t.taxable, 1800, 'taxable');
  eq(t.tax, 360, 'tax 20%');
  eq(t.total, 2210, 'total');
  eq(t.balance, 1710, 'balance after payment');
}

// ---- compute: GST intra-state vs inter-state ----
{
  const doc = blankDocument('invoice');
  doc.currency = 'INR';
  doc.items = [{ ...blankItem(), qty: 1, rate: 10000 }];
  doc.taxMode = 'gst';
  doc.gst = { sellerGstin: '', buyerGstin: '', sellerState: '27', supplyState: '27', rate: 18 };
  const intra = compute(doc);
  eq([intra.gstSplit.cgst, intra.gstSplit.sgst, intra.gstSplit.igst], [900, 900, 0], 'intra-state CGST/SGST');
  doc.gst.supplyState = '29';
  const inter = compute(doc);
  eq([inter.gstSplit.cgst, inter.gstSplit.sgst, inter.gstSplit.igst], [0, 0, 1800], 'inter-state IGST');
  eq(inter.total, 11800, 'GST total');
}

// ---- compute: per-line + ledger ----
{
  const doc = blankDocument('invoice');
  doc.items = [
    { ...blankItem(), qty: 2, rate: 100, taxPct: 10, discPct: 50 },
  ];
  doc.showLineTax = true;
  doc.showLineDiscount = true;
  doc.taxMode = 'perline';
  doc.ledger = [{ date: '2026-06-01', amount: 50 }, { date: '2026-06-05', amount: 25 }];
  const t = compute(doc);
  eq(t.subtotal, 100, 'per-line discounted subtotal');
  eq(t.tax, 10, 'per-line tax');
  eq(t.total, 110, 'per-line total');
  eq(t.paid, 75, 'ledger paid');
  eq(t.balance, 35, 'ledger balance');
}

// ---- layout: produces pages with primitives, paginates long docs ----
{
  const measure = (text, font, size) => String(text).length * size * 0.5;
  const doc = blankDocument('invoice');
  doc.business.name = 'Acme Studio';
  doc.client.name = 'Client Co';
  doc.items = Array.from({ length: 60 }, (_, i) => ({ ...blankItem(), description: `Line item number ${i + 1} with some descriptive text`, qty: 1, rate: 50 }));
  doc.wordsMode = 'western';
  doc.notes = 'Thank you.';
  const { pages, totals } = layoutDocument(doc, measure);
  eq(pages.length > 1, true, 'long invoice paginates');
  eq(pages.every((p) => p.prims.length > 0), true, 'all pages have primitives');
  eq(totals.total, 3000, 'layout totals come from compute');
  const hasPageNum = pages[0].prims.some((p) => p.t === 'text' && /Page 1 of/.test(p.text));
  eq(hasPageNum, true, 'page numbers on multipage docs');
  // single page invoice: no page numbers
  const doc2 = blankDocument('invoice');
  doc2.items = [{ ...blankItem(), qty: 1, rate: 100, description: 'One' }];
  const r2 = layoutDocument(doc2, measure);
  eq(r2.pages.length, 1, 'short invoice single page');
  eq(r2.pages[0].prims.some((p) => p.t === 'text' && /Page/.test(p.text)), false, 'no page number on single page');
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll smoke tests passed.');
process.exit(failures ? 1 : 0);
