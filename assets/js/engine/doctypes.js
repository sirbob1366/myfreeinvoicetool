// Per-document-type configuration. Every page in the document family is this
// same engine with a different entry here. (Family pages land in Stage 3.)

export const DOCTYPES = {
  invoice: {
    id: 'invoice', titleKey: 'invoice', prefix: 'INV',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: true,
    fileLabel: 'Invoice',
  },
  'gst-invoice': {
    id: 'gst-invoice', titleKey: 'taxInvoice', prefix: 'INV',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: true,
    fileLabel: 'Tax-Invoice', forceGST: true,
  },
  estimate: {
    id: 'estimate', titleKey: 'estimate', prefix: 'EST',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Estimate', convertsTo: 'invoice',
  },
  quotation: {
    id: 'quotation', titleKey: 'quotation', prefix: 'QUO',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Quotation', convertsTo: 'invoice',
  },
  proforma: {
    id: 'proforma', titleKey: 'proforma', prefix: 'PRO',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: false,
    fileLabel: 'Proforma-Invoice',
  },
  receipt: {
    id: 'receipt', titleKey: 'receipt', prefix: 'RCT',
    partyLabel: 'from', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Receipt', receivedFrom: true,
  },
  'credit-note': {
    id: 'credit-note', titleKey: 'creditNote', prefix: 'CRN',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Credit-Note',
  },
  'debit-note': {
    id: 'debit-note', titleKey: 'debitNote', prefix: 'DBN',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Debit-Note',
  },
  'purchase-order': {
    id: 'purchase-order', titleKey: 'purchaseOrder', prefix: 'PO',
    partyLabel: 'shipTo', hasDueDate: true, hasPayment: false, hasBalance: false,
    fileLabel: 'Purchase-Order',
  },
};

export function doctype(id) {
  return DOCTYPES[id] || DOCTYPES.invoice;
}
