// Printed-document label dictionary. Site UI stays English; the labels that
// appear ON the document switch language — a feature competitors paywall.
// The engine only ever reads labels through L().

export const LANGS = [
  { id: 'en', name: 'English', rtl: false },
  { id: 'hi', name: 'हिन्दी (Hindi)', rtl: false },
  { id: 'es', name: 'Español', rtl: false },
  { id: 'fr', name: 'Français', rtl: false },
  { id: 'de', name: 'Deutsch', rtl: false },
  { id: 'pt', name: 'Português', rtl: false },
  { id: 'it', name: 'Italiano', rtl: false },
  { id: 'nl', name: 'Nederlands', rtl: false },
  { id: 'ar', name: 'العربية (Arabic)', rtl: true },
  { id: 'id', name: 'Bahasa Indonesia', rtl: false },
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
  paymentsRecorded: 'Payments recorded', date: 'Date', note: 'Note', scanToPay: 'Scan to pay (UPI)',
};

const HI = {
  invoice: 'चालान', taxInvoice: 'कर चालान', estimate: 'अनुमान', quotation: 'कोटेशन',
  proforma: 'प्रोफ़ॉर्मा चालान', receipt: 'रसीद', creditNote: 'क्रेडिट नोट', debitNote: 'डेबिट नोट',
  purchaseOrder: 'क्रय आदेश', deliveryChallan: 'डिलीवरी चालान', commercialInvoice: 'वाणिज्यिक चालान',
  rentReceipt: 'किराया रसीद', salarySlip: 'वेतन पर्ची', timesheet: 'समय-पत्रक', expenseReport: 'व्यय विवरण',
  billTo: 'बिल प्राप्तकर्ता', shipTo: 'प्रेषण पता', from: 'प्रेषक',
  number: 'क्रमांक', issueDate: 'जारी तिथि', dueDate: 'देय तिथि', poRef: 'पीओ / संदर्भ',
  description: 'विवरण', qty: 'मात्रा', hours: 'घंटे', rate: 'दर', amount: 'राशि',
  hsn: 'HSN/SAC', disc: 'छूट %', tax: 'कर %',
  subtotal: 'उप-योग', discount: 'छूट', taxableValue: 'कर योग्य मूल्य',
  shipping: 'शिपिंग', tip: 'टिप', total: 'कुल', amountPaid: 'भुगतान की गई राशि', balanceDue: 'शेष राशि',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'राशि शब्दों में', notes: 'टिप्पणियाँ', terms: 'शर्तें',
  paymentDetails: 'भुगतान विवरण', payVia: 'भुगतान माध्यम', bankTransfer: 'बैंक अंतरण',
  gstin: 'GSTIN', placeOfSupply: 'आपूर्ति का स्थान',
  page: 'पृष्ठ', of: '/', signature: 'अधिकृत हस्ताक्षरकर्ता',
  paymentsRecorded: 'दर्ज भुगतान', date: 'तिथि', note: 'टिप्पणी', scanToPay: 'भुगतान हेतु स्कैन करें (UPI)',
};

const ES = {
  invoice: 'Factura', taxInvoice: 'Factura fiscal', estimate: 'Presupuesto', quotation: 'Cotización',
  proforma: 'Factura proforma', receipt: 'Recibo', creditNote: 'Nota de crédito', debitNote: 'Nota de débito',
  purchaseOrder: 'Orden de compra', deliveryChallan: 'Albarán de entrega', commercialInvoice: 'Factura comercial',
  rentReceipt: 'Recibo de alquiler', salarySlip: 'Nómina', timesheet: 'Hoja de horas', expenseReport: 'Informe de gastos',
  billTo: 'Facturar a', shipTo: 'Enviar a', from: 'De',
  number: 'N.º', issueDate: 'Fecha de emisión', dueDate: 'Fecha de vencimiento', poRef: 'Pedido / Ref.',
  description: 'Descripción', qty: 'Cant.', hours: 'Horas', rate: 'Precio', amount: 'Importe',
  hsn: 'HSN/SAC', disc: 'Dto. %', tax: 'Imp. %',
  subtotal: 'Subtotal', discount: 'Descuento', taxableValue: 'Base imponible',
  shipping: 'Envío', tip: 'Propina', total: 'Total', amountPaid: 'Importe pagado', balanceDue: 'Saldo pendiente',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Importe en letras', notes: 'Notas', terms: 'Condiciones',
  paymentDetails: 'Datos de pago', payVia: 'Pagar por', bankTransfer: 'Transferencia bancaria',
  gstin: 'NIF', placeOfSupply: 'Lugar de suministro',
  page: 'Página', of: 'de', signature: 'Firmante autorizado',
  paymentsRecorded: 'Pagos registrados', date: 'Fecha', note: 'Nota', scanToPay: 'Escanear para pagar (UPI)',
};

const FR = {
  invoice: 'Facture', taxInvoice: 'Facture fiscale', estimate: 'Devis estimatif', quotation: 'Devis',
  proforma: 'Facture pro forma', receipt: 'Reçu', creditNote: 'Avoir', debitNote: 'Note de débit',
  purchaseOrder: 'Bon de commande', deliveryChallan: 'Bon de livraison', commercialInvoice: 'Facture commerciale',
  rentReceipt: 'Quittance de loyer', salarySlip: 'Bulletin de paie', timesheet: 'Feuille de temps', expenseReport: 'Note de frais',
  billTo: 'Facturé à', shipTo: 'Livré à', from: 'De',
  number: 'N°', issueDate: "Date d'émission", dueDate: "Date d'échéance", poRef: 'Commande / Réf.',
  description: 'Description', qty: 'Qté', hours: 'Heures', rate: 'Prix unitaire', amount: 'Montant',
  hsn: 'HSN/SAC', disc: 'Rem. %', tax: 'TVA %',
  subtotal: 'Sous-total', discount: 'Remise', taxableValue: 'Base imposable',
  shipping: 'Livraison', tip: 'Pourboire', total: 'Total', amountPaid: 'Montant payé', balanceDue: 'Solde dû',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Montant en lettres', notes: 'Notes', terms: 'Conditions',
  paymentDetails: 'Coordonnées de paiement', payVia: 'Payer par', bankTransfer: 'Virement bancaire',
  gstin: 'N° TVA', placeOfSupply: 'Lieu de livraison',
  page: 'Page', of: 'sur', signature: 'Signataire autorisé',
  paymentsRecorded: 'Paiements enregistrés', date: 'Date', note: 'Note', scanToPay: 'Scanner pour payer (UPI)',
};

const DE = {
  invoice: 'Rechnung', taxInvoice: 'Steuerrechnung', estimate: 'Kostenvoranschlag', quotation: 'Angebot',
  proforma: 'Proforma-Rechnung', receipt: 'Quittung', creditNote: 'Gutschrift', debitNote: 'Lastschrift',
  purchaseOrder: 'Bestellung', deliveryChallan: 'Lieferschein', commercialInvoice: 'Handelsrechnung',
  rentReceipt: 'Mietquittung', salarySlip: 'Gehaltsabrechnung', timesheet: 'Stundenzettel', expenseReport: 'Spesenabrechnung',
  billTo: 'Rechnung an', shipTo: 'Lieferung an', from: 'Von',
  number: 'Nr.', issueDate: 'Rechnungsdatum', dueDate: 'Fälligkeitsdatum', poRef: 'Bestell-Nr. / Ref.',
  description: 'Beschreibung', qty: 'Menge', hours: 'Stunden', rate: 'Einzelpreis', amount: 'Betrag',
  hsn: 'HSN/SAC', disc: 'Rabatt %', tax: 'USt. %',
  subtotal: 'Zwischensumme', discount: 'Rabatt', taxableValue: 'Steuerbasis',
  shipping: 'Versand', tip: 'Trinkgeld', total: 'Gesamt', amountPaid: 'Bezahlter Betrag', balanceDue: 'Offener Betrag',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Betrag in Worten', notes: 'Anmerkungen', terms: 'Bedingungen',
  paymentDetails: 'Zahlungsdetails', payVia: 'Zahlung per', bankTransfer: 'Überweisung',
  gstin: 'USt-IdNr.', placeOfSupply: 'Lieferort',
  page: 'Seite', of: 'von', signature: 'Bevollmächtigte Unterschrift',
  paymentsRecorded: 'Erfasste Zahlungen', date: 'Datum', note: 'Notiz', scanToPay: 'Zum Bezahlen scannen (UPI)',
};

const PT = {
  invoice: 'Fatura', taxInvoice: 'Fatura fiscal', estimate: 'Orçamento', quotation: 'Cotação',
  proforma: 'Fatura pró-forma', receipt: 'Recibo', creditNote: 'Nota de crédito', debitNote: 'Nota de débito',
  purchaseOrder: 'Ordem de compra', deliveryChallan: 'Guia de entrega', commercialInvoice: 'Fatura comercial',
  rentReceipt: 'Recibo de aluguel', salarySlip: 'Holerite', timesheet: 'Folha de horas', expenseReport: 'Relatório de despesas',
  billTo: 'Faturar para', shipTo: 'Enviar para', from: 'De',
  number: 'N.º', issueDate: 'Data de emissão', dueDate: 'Data de vencimento', poRef: 'Pedido / Ref.',
  description: 'Descrição', qty: 'Qtd.', hours: 'Horas', rate: 'Preço', amount: 'Valor',
  hsn: 'HSN/SAC', disc: 'Desc. %', tax: 'Imp. %',
  subtotal: 'Subtotal', discount: 'Desconto', taxableValue: 'Base tributável',
  shipping: 'Frete', tip: 'Gorjeta', total: 'Total', amountPaid: 'Valor pago', balanceDue: 'Saldo devido',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Valor por extenso', notes: 'Observações', terms: 'Condições',
  paymentDetails: 'Dados de pagamento', payVia: 'Pagar via', bankTransfer: 'Transferência bancária',
  gstin: 'CNPJ/NIF', placeOfSupply: 'Local de fornecimento',
  page: 'Página', of: 'de', signature: 'Assinatura autorizada',
  paymentsRecorded: 'Pagamentos registrados', date: 'Data', note: 'Nota', scanToPay: 'Escaneie para pagar (UPI)',
};

const IT = {
  invoice: 'Fattura', taxInvoice: 'Fattura fiscale', estimate: 'Preventivo', quotation: 'Quotazione',
  proforma: 'Fattura proforma', receipt: 'Ricevuta', creditNote: 'Nota di credito', debitNote: 'Nota di debito',
  purchaseOrder: "Ordine d'acquisto", deliveryChallan: 'Documento di trasporto', commercialInvoice: 'Fattura commerciale',
  rentReceipt: "Ricevuta d'affitto", salarySlip: 'Busta paga', timesheet: 'Foglio ore', expenseReport: 'Nota spese',
  billTo: 'Fatturare a', shipTo: 'Spedire a', from: 'Da',
  number: 'N.', issueDate: 'Data di emissione', dueDate: 'Data di scadenza', poRef: 'Ordine / Rif.',
  description: 'Descrizione', qty: 'Q.tà', hours: 'Ore', rate: 'Prezzo', amount: 'Importo',
  hsn: 'HSN/SAC', disc: 'Sconto %', tax: 'IVA %',
  subtotal: 'Subtotale', discount: 'Sconto', taxableValue: 'Imponibile',
  shipping: 'Spedizione', tip: 'Mancia', total: 'Totale', amountPaid: 'Importo pagato', balanceDue: 'Saldo dovuto',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Importo in lettere', notes: 'Note', terms: 'Termini',
  paymentDetails: 'Dettagli di pagamento', payVia: 'Paga con', bankTransfer: 'Bonifico bancario',
  gstin: 'P. IVA', placeOfSupply: 'Luogo di fornitura',
  page: 'Pagina', of: 'di', signature: 'Firmatario autorizzato',
  paymentsRecorded: 'Pagamenti registrati', date: 'Data', note: 'Nota', scanToPay: 'Scansiona per pagare (UPI)',
};

const NL = {
  invoice: 'Factuur', taxInvoice: 'Belastingfactuur', estimate: 'Offerte (raming)', quotation: 'Offerte',
  proforma: 'Pro-formafactuur', receipt: 'Kwitantie', creditNote: 'Creditnota', debitNote: 'Debetnota',
  purchaseOrder: 'Inkooporder', deliveryChallan: 'Pakbon', commercialInvoice: 'Handelsfactuur',
  rentReceipt: 'Huurkwitantie', salarySlip: 'Loonstrook', timesheet: 'Urenstaat', expenseReport: 'Onkostendeclaratie',
  billTo: 'Factureren aan', shipTo: 'Verzenden naar', from: 'Van',
  number: 'Nr.', issueDate: 'Factuurdatum', dueDate: 'Vervaldatum', poRef: 'Order / Ref.',
  description: 'Omschrijving', qty: 'Aantal', hours: 'Uren', rate: 'Tarief', amount: 'Bedrag',
  hsn: 'HSN/SAC', disc: 'Korting %', tax: 'Btw %',
  subtotal: 'Subtotaal', discount: 'Korting', taxableValue: 'Belastbare waarde',
  shipping: 'Verzending', tip: 'Fooi', total: 'Totaal', amountPaid: 'Betaald bedrag', balanceDue: 'Openstaand saldo',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Bedrag in woorden', notes: 'Opmerkingen', terms: 'Voorwaarden',
  paymentDetails: 'Betaalgegevens', payVia: 'Betalen via', bankTransfer: 'Bankoverschrijving',
  gstin: 'Btw-nr.', placeOfSupply: 'Plaats van levering',
  page: 'Pagina', of: 'van', signature: 'Gemachtigde ondertekenaar',
  paymentsRecorded: 'Geregistreerde betalingen', date: 'Datum', note: 'Notitie', scanToPay: 'Scan om te betalen (UPI)',
};

const AR = {
  invoice: 'فاتورة', taxInvoice: 'فاتورة ضريبية', estimate: 'تقدير', quotation: 'عرض سعر',
  proforma: 'فاتورة مبدئية', receipt: 'إيصال', creditNote: 'إشعار دائن', debitNote: 'إشعار مدين',
  purchaseOrder: 'أمر شراء', deliveryChallan: 'إذن تسليم', commercialInvoice: 'فاتورة تجارية',
  rentReceipt: 'إيصال إيجار', salarySlip: 'قسيمة راتب', timesheet: 'سجل الساعات', expenseReport: 'تقرير مصروفات',
  billTo: 'فاتورة إلى', shipTo: 'الشحن إلى', from: 'من',
  number: 'رقم', issueDate: 'تاريخ الإصدار', dueDate: 'تاريخ الاستحقاق', poRef: 'أمر شراء / مرجع',
  description: 'الوصف', qty: 'الكمية', hours: 'الساعات', rate: 'السعر', amount: 'المبلغ',
  hsn: 'HSN/SAC', disc: 'خصم ٪', tax: 'ضريبة ٪',
  subtotal: 'المجموع الفرعي', discount: 'الخصم', taxableValue: 'القيمة الخاضعة للضريبة',
  shipping: 'الشحن', tip: 'إكرامية', total: 'الإجمالي', amountPaid: 'المبلغ المدفوع', balanceDue: 'الرصيد المستحق',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'المبلغ كتابةً', notes: 'ملاحظات', terms: 'الشروط',
  paymentDetails: 'تفاصيل الدفع', payVia: 'الدفع عبر', bankTransfer: 'تحويل بنكي',
  gstin: 'الرقم الضريبي', placeOfSupply: 'مكان التوريد',
  page: 'صفحة', of: 'من', signature: 'الموقّع المفوض',
  paymentsRecorded: 'المدفوعات المسجلة', date: 'التاريخ', note: 'ملاحظة', scanToPay: 'امسح للدفع (UPI)',
};

const ID = {
  invoice: 'Faktur', taxInvoice: 'Faktur Pajak', estimate: 'Estimasi', quotation: 'Penawaran',
  proforma: 'Faktur Proforma', receipt: 'Kuitansi', creditNote: 'Nota Kredit', debitNote: 'Nota Debit',
  purchaseOrder: 'Pesanan Pembelian', deliveryChallan: 'Surat Jalan', commercialInvoice: 'Faktur Komersial',
  rentReceipt: 'Kuitansi Sewa', salarySlip: 'Slip Gaji', timesheet: 'Lembar Waktu', expenseReport: 'Laporan Pengeluaran',
  billTo: 'Ditagihkan kepada', shipTo: 'Dikirim ke', from: 'Dari',
  number: 'No.', issueDate: 'Tanggal terbit', dueDate: 'Jatuh tempo', poRef: 'PO / Ref.',
  description: 'Deskripsi', qty: 'Jml', hours: 'Jam', rate: 'Tarif', amount: 'Jumlah',
  hsn: 'HSN/SAC', disc: 'Disk. %', tax: 'Pajak %',
  subtotal: 'Subtotal', discount: 'Diskon', taxableValue: 'Nilai kena pajak',
  shipping: 'Pengiriman', tip: 'Tip', total: 'Total', amountPaid: 'Jumlah dibayar', balanceDue: 'Sisa tagihan',
  cgst: 'CGST', sgst: 'SGST', igst: 'IGST',
  amountInWords: 'Terbilang', notes: 'Catatan', terms: 'Ketentuan',
  paymentDetails: 'Detail pembayaran', payVia: 'Bayar melalui', bankTransfer: 'Transfer bank',
  gstin: 'NPWP', placeOfSupply: 'Tempat penyerahan',
  page: 'Halaman', of: 'dari', signature: 'Penandatangan resmi',
  paymentsRecorded: 'Pembayaran tercatat', date: 'Tanggal', note: 'Catatan', scanToPay: 'Pindai untuk bayar (UPI)',
};

const DICT = { en: EN, hi: HI, es: ES, fr: FR, de: DE, pt: PT, it: IT, nl: NL, ar: AR, id: ID };

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
