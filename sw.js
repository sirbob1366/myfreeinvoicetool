// Service worker: the entire app — every generator, calculator and the PDF
// engine — works offline after the first visit.

const VERSION = 'mfit-v1';
const CORE = [
  '/', '/index.html',
  '/invoice/', '/gst-invoice/', '/estimate/', '/quotation-maker/', '/proforma-invoice/',
  '/receipt-maker/', '/rent-receipt/', '/salary-slip/', '/credit-note/', '/debit-note/',
  '/purchase-order/', '/delivery-challan/', '/commercial-invoice/', '/timesheet/',
  '/expense-report/', '/letterhead-maker/',
  '/dashboard/', '/bulk-invoices/',
  '/gst-calculator/', '/vat-calculator/', '/sales-tax-calculator/', '/late-fee-calculator/',
  '/freelance-rate-calculator/', '/margin-markup-calculator/', '/discount-calculator/',
  '/payment-reminder/', '/upi-qr-generator/',
  '/assets/css/base.css', '/assets/css/engine.css', '/assets/css/dashboard.css', '/assets/css/calc.css',
  '/assets/js/store.js', '/assets/js/docstatus.js', '/assets/js/dashboard.js',
  '/assets/js/reminder.js', '/assets/js/bulk.js', '/assets/js/pwa.js',
  '/assets/js/engine/app.js', '/assets/js/engine/model.js', '/assets/js/engine/layout.js',
  '/assets/js/engine/preview.js', '/assets/js/engine/pdf.js', '/assets/js/engine/templates.js',
  '/assets/js/engine/labels.js', '/assets/js/engine/doctypes.js',
  '/assets/js/custom/kit.js', '/assets/js/custom/rent-receipt.js', '/assets/js/custom/salary-slip.js',
  '/assets/js/custom/timesheet.js', '/assets/js/custom/expense-report.js', '/assets/js/custom/letterhead.js',
  '/assets/js/util/money.js', '/assets/js/util/words.js', '/assets/js/util/dates.js',
  '/assets/js/util/numbering.js', '/assets/js/util/states.js', '/assets/js/util/qr.js',
  '/vendor/pdf-lib/pdf-lib.min.js', '/vendor/qrcode/qrcode.js', '/vendor/jszip/jszip.min.js',
  '/favicon.svg', '/manifest.webmanifest',
  '/samples/bulk-invoices-sample.csv',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // Pages: network first (fresh content), cache fallback (offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/invoice/')))
    );
    return;
  }

  // Assets: cache first, then network (and cache what we fetch).
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
