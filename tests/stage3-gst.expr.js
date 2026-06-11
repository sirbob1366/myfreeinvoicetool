(async () => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const out = {};
  out.taxMode = document.querySelector('[data-bind="taxMode"]').value;
  out.currency = document.querySelector('[data-bind="currency"]').value;
  out.template = document.querySelector('[data-bind="template"]').value;

  set('[data-bind="business.name"]', 'Bharat Designs');
  set('[data-bind="client.name"]', 'Acme India Pvt Ltd');
  set('[data-bind="gst.sellerGstin"]', '27AAPFU0939F1ZV');
  set('[data-bind="gst.sellerState"]', '27');
  set('[data-bind="gst.supplyState"]', '29');
  set('.i-desc', 'Brand identity design');
  set('.i-hsn', '998391');
  set('.i-qty', '1');
  set('.i-rate', '100000');
  set('[data-bind="payment.upiId"]', 'bharat@okhdfcbank');
  set('[data-bind="payment.upiName"]', 'Bharat Designs');
  await new Promise((r) => setTimeout(r, 900));

  const texts = [...document.querySelectorAll('.pv-text')].map((e) => e.textContent);
  out.title = texts.find((t) => /TAX INVOICE/i.test(t));
  out.igstRow = texts.find((t) => t.includes('IGST'));
  out.cgstRow = texts.find((t) => t.includes('CGST')) || null;
  out.rupee = texts.find((t) => t.includes('₹1,00,000') || t.includes('1,00,000'));
  out.hsn = texts.find((t) => t === '998391');
  out.qrInPreview = [...document.querySelectorAll('.pv-page img')].some((i) => i.src.startsWith('data:image/png'));
  out.scanLabel = texts.find((t) => /Scan to pay/i.test(t));

  // intra-state check
  set('[data-bind="gst.supplyState"]', '27');
  await new Promise((r) => setTimeout(r, 400));
  const texts2 = [...document.querySelectorAll('.pv-text')].map((e) => e.textContent);
  out.cgstAfter = texts2.find((t) => t.includes('CGST'));
  out.sgstAfter = texts2.find((t) => t.includes('SGST'));

  // Hindi labels
  set('[data-bind="language"]', 'hi');
  await new Promise((r) => setTimeout(r, 400));
  const texts3 = [...document.querySelectorAll('.pv-text')].map((e) => e.textContent);
  out.hindiTitle = texts3.find((t) => t.includes('कर चालान'));
  out.hindiTotal = texts3.find((t) => t.includes('कुल'));

  // Arabic RTL: title should be right-anchored after mirroring
  set('[data-bind="language"]', 'ar');
  await new Promise((r) => setTimeout(r, 400));
  const texts4 = [...document.querySelectorAll('.pv-text')].map((e) => e.textContent);
  out.arabicTitle = texts4.find((t) => t.includes('فاتورة ضريبية'));

  // PDF with complex scripts + QR
  const m = await import('/assets/js/engine/pdf.js');
  const appDoc = window.__doc;
  let pdfOk = null;
  try {
    const bytes = await m.renderPDF(appDoc || (await import('/assets/js/engine/model.js')).blankDocument('gst-invoice'));
    pdfOk = bytes.length;
  } catch (e) { pdfOk = 'ERR ' + e.message; }
  out.pdfBytes = pdfOk;
  return out;
})()
