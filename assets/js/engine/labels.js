// Printed-document label dictionary. Site UI stays English; the labels that
// appear ON the document switch language. More languages land in Stage 3 —
// the engine only ever reads labels through L().

export const LANGS = [
  { id: 'en', name: 'English', rtl: false },
  // hi, es, fr, de, pt, it, nl, ar (RTL), id — added in Stage 3
];

const EN = {
  invoice: 'Invoice', taxInvoice: 'Tax Invoice', estimate: 'Estimate', quotation: 'Quotation',
  proforma: 'Proforma Invoice', receipt: 'Receipt', creditNote: 'Credit Note', debitNote: 'Debit Note',
  purchaseOrder: 'Purchase Order', deliveryChallan: 'Delivery Challan', commercialInvoice: 'Commercial Invoice',
  rentReceipt: 'Rent Receipt', salarySlip: 'Salary Slip', timesheet: 'Timesheet', expenseReport: 'Expense Report',

  billTo: 'Bill To', shipTo: 'Ship To', from: 'From',
  number: 'No.', issueDate: 'Issue date', dueDate: 'Due date', poRef: 'PO / Ref',
  description: 'Description', qty: 'Qty', hours: 'Hours', rate: 'Rate', amount: 'Amount',
  hsn: 'HSN/SAC', disc: 'Disc %', tax: 'Tax %',
  subtotal: 'Subtotal', discount: 'Discount', taxableValue: 'Taxable value',
  shipping: 'Shipping', tip: 'Tip', total: 'Total', amountPaid: 'Amount paid', balanceDue: 'Balance due',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Amount in words', notes: 'Notes', terms: 'Terms',
  paymentDetails: 'Payment details', payVia: 'Pay via', bankTransfer: 'Bank transfer',
  gstin: 'GSTIN', placeOfSupply: 'Place of supply',
  page: 'Page', of: 'of', signature: 'Authorized signatory',
  paymentsRecorded: 'Payments recorded', date: 'Date', note: 'Note',
};

const DICT = { en: EN };

export function L(lang, key) {
  const d = DICT[lang] || EN;
  return d[key] ?? EN[key] ?? key;
}

export function registerLang(id, dict) {
  DICT[id] = { ...EN, ...dict };
}

export function isRTL(lang) {
  return (LANGS.find((l) => l.id === lang) || {}).rtl === true;
}
