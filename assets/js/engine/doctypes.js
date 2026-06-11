// Per-document-type configuration. Every page in the document family is this
// same engine with a different entry here.
//   page        — the SEO page that edits this doctype
//   convertsTo  — one-click lifecycle conversion target
//   showHsn     — always show the HSN/HS-code column (GST mode also shows it)
//   extraFields — [key, label] pairs stored in doc.extra and printed in the meta zone

export const DOCTYPES = {
  invoice: {
    id: 'invoice', titleKey: 'invoice', prefix: 'INV', page: '/invoice/',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: true,
    fileLabel: 'Invoice',
  },
  'gst-invoice': {
    id: 'gst-invoice', titleKey: 'taxInvoice', prefix: 'INV', page: '/gst-invoice/',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: true,
    fileLabel: 'Tax-Invoice', forceGST: true,
  },
  estimate: {
    id: 'estimate', titleKey: 'estimate', prefix: 'EST', page: '/estimate/',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Estimate', convertsTo: 'invoice',
  },
  quotation: {
    id: 'quotation', titleKey: 'quotation', prefix: 'QUO', page: '/quotation-maker/',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Quotation', convertsTo: 'invoice',
  },
  proforma: {
    id: 'proforma', titleKey: 'proforma', prefix: 'PRO', page: '/proforma-invoice/',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: false,
    fileLabel: 'Proforma-Invoice', convertsTo: 'invoice',
  },
  receipt: {
    id: 'receipt', titleKey: 'receipt', prefix: 'RCT', page: '/receipt-maker/',
    partyLabel: 'from', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Receipt',
  },
  'credit-note': {
    id: 'credit-note', titleKey: 'creditNote', prefix: 'CRN', page: '/credit-note/',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Credit-Note',
  },
  'debit-note': {
    id: 'debit-note', titleKey: 'debitNote', prefix: 'DBN', page: '/debit-note/',
    partyLabel: 'billTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Debit-Note',
  },
  'purchase-order': {
    id: 'purchase-order', titleKey: 'purchaseOrder', prefix: 'PO', page: '/purchase-order/',
    partyLabel: 'shipTo', hasDueDate: true, hasPayment: false, hasBalance: false,
    fileLabel: 'Purchase-Order',
  },
  'delivery-challan': {
    id: 'delivery-challan', titleKey: 'deliveryChallan', prefix: 'DC', page: '/delivery-challan/',
    partyLabel: 'shipTo', hasDueDate: false, hasPayment: false, hasBalance: false,
    fileLabel: 'Delivery-Challan', showHsn: true,
    extraFields: [['vehicle', 'Vehicle no.'], ['transporter', 'Transporter'], ['ewaybill', 'E-way bill no.']],
  },
  'commercial-invoice': {
    id: 'commercial-invoice', titleKey: 'commercialInvoice', prefix: 'CI', page: '/commercial-invoice/',
    partyLabel: 'billTo', hasDueDate: true, hasPayment: true, hasBalance: true,
    fileLabel: 'Commercial-Invoice', showHsn: true, hsnLabel: 'HS Code',
    extraFields: [
      ['incoterms', 'Incoterms'], ['origin', 'Country of origin'],
      ['destination', 'Country of destination'], ['awb', 'AWB / BL no.'],
      ['exportRef', 'Export reference'],
    ],
  },
};

export function doctype(id) {
  return DOCTYPES[id] || DOCTYPES.invoice;
}
