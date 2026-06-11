// Document state model and totals math. One model powers every document type.

import { roundMoney } from '../util/money.js';
import { todayISO, addDays } from '../util/dates.js';

export function blankDocument(docType = 'invoice') {
  return {
    docType,
    title: '',              // override of the printed title; '' = doctype default
    number: 'INV-001',
    issueDate: todayISO(),
    dueDate: addDays(todayISO(), 30),
    termsPreset: 'net30',
    poRef: '',
    currency: 'USD',
    pageSize: 'a4',          // 'a4' | 'letter'
    template: 'classic-serif',
    brandColor: '#11233f',
    fontPair: 'serif',       // 'serif' | 'sans' headings
    language: 'en',

    business: { name: '', address: '', email: '', phone: '', taxLabel: 'Tax ID', taxValue: '', logo: '' },
    client: { name: '', address: '', email: '', phone: '', gstin: '', state: '' },

    itemMode: 'qty',         // 'qty' | 'hours'
    items: [blankItem()],
    showLineTax: false,
    showLineDiscount: false,

    discount: { type: 'pct', value: 0 },   // document-level
    taxMode: 'none',         // 'none' | 'single' | 'perline' | 'gst'
    taxLabel: 'Tax',
    taxPct: 0,
    gst: { sellerGstin: '', buyerGstin: '', sellerState: '', supplyState: '', rate: 18 },
    shipping: 0,
    tip: 0,
    amountPaid: 0,

    wordsMode: 'off',        // 'off' | 'western' | 'indian'
    notes: '',
    terms: '',
    payment: { bank: '', paypal: '', upiId: '', upiName: '' },
    signature: '',           // dataURL
    signatureLabel: 'Authorized signatory',

    ledger: [],              // [{date, amount, note}] — partial payments (workspace)
    showLedgerOnDoc: false,
  };
}

export function blankItem() {
  return { description: '', qty: 1, rate: 0, taxPct: 0, discPct: 0, hsn: '' };
}

const num = (v) => (Number.isFinite(+v) ? +v : 0);

// All money values are rounded per-currency at the points a human would round
// on paper: line totals, each totals row, and the grand total.
export function compute(doc) {
  const c = doc.currency;
  const lines = doc.items.map((it) => {
    const base = num(it.qty) * num(it.rate);
    const disc = doc.showLineDiscount ? base * (num(it.discPct) / 100) : 0;
    const net = base - disc;
    const tax = doc.taxMode === 'perline' && doc.showLineTax ? net * (num(it.taxPct) / 100) : 0;
    return {
      amount: roundMoney(net, c),
      tax: roundMoney(tax, c),
      discount: roundMoney(disc, c),
    };
  });

  const subtotal = roundMoney(lines.reduce((s, l) => s + l.amount, 0), c);

  let discountTotal = 0;
  if (num(doc.discount.value) > 0) {
    discountTotal =
      doc.discount.type === 'pct'
        ? subtotal * (num(doc.discount.value) / 100)
        : num(doc.discount.value);
  }
  discountTotal = roundMoney(Math.min(discountTotal, subtotal), c);

  const taxable = roundMoney(subtotal - discountTotal, c);

  let tax = 0;
  let gstSplit = null;
  if (doc.taxMode === 'single') {
    tax = taxable * (num(doc.taxPct) / 100);
  } else if (doc.taxMode === 'perline') {
    // Per-line tax was computed on each line's net; document discount scales it.
    const lineTax = lines.reduce((s, l) => s + l.tax, 0);
    const scale = subtotal > 0 ? taxable / subtotal : 1;
    tax = lineTax * scale;
  } else if (doc.taxMode === 'gst') {
    const rate = num(doc.gst.rate);
    const interstate =
      doc.gst.sellerState && doc.gst.supplyState && doc.gst.sellerState !== doc.gst.supplyState;
    if (interstate) {
      gstSplit = { igst: roundMoney(taxable * rate / 100, c), cgst: 0, sgst: 0, rate, interstate };
    } else {
      const half = roundMoney(taxable * rate / 200, c);
      gstSplit = { igst: 0, cgst: half, sgst: half, rate, interstate };
    }
    tax = gstSplit.igst + gstSplit.cgst + gstSplit.sgst;
  }
  tax = roundMoney(tax, c);

  const shipping = roundMoney(num(doc.shipping), c);
  const tip = roundMoney(num(doc.tip), c);
  const total = roundMoney(taxable + tax + shipping + tip, c);

  const ledgerPaid = roundMoney((doc.ledger || []).reduce((s, p) => s + num(p.amount), 0), c);
  const paid = roundMoney(num(doc.amountPaid) + ledgerPaid, c);
  const balance = roundMoney(total - paid, c);

  return { lines, subtotal, discountTotal, taxable, tax, gstSplit, shipping, tip, total, paid, ledgerPaid, balance };
}
