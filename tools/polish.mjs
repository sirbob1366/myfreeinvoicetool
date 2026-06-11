// Stage 6 polish: sitemap.xml, favicon.ico, GA4 placeholder + full footer on
// the hand-written pages. Run: node tools/polish.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { FOOTER } from './gen-pages.mjs';

const SITE = 'https://myfreeinvoicetool.com';
const root = new URL('..', import.meta.url);

// ---------------------------------------------------------------- sitemap

const URLS = [
  ['', 1.0], ['invoice/', 1.0], ['gst-invoice/', 0.9],
  ['estimate/', 0.8], ['quotation-maker/', 0.8], ['proforma-invoice/', 0.7],
  ['receipt-maker/', 0.8], ['rent-receipt/', 0.9], ['salary-slip/', 0.8],
  ['credit-note/', 0.6], ['debit-note/', 0.6], ['purchase-order/', 0.7],
  ['delivery-challan/', 0.7], ['commercial-invoice/', 0.7], ['timesheet/', 0.7],
  ['expense-report/', 0.6], ['letterhead-maker/', 0.6],
  ['gst-calculator/', 0.8], ['vat-calculator/', 0.7], ['sales-tax-calculator/', 0.7],
  ['late-fee-calculator/', 0.7], ['freelance-rate-calculator/', 0.8],
  ['margin-markup-calculator/', 0.7], ['discount-calculator/', 0.6],
  ['bulk-invoices/', 0.8], ['payment-reminder/', 0.8], ['upi-qr-generator/', 0.9],
  ['about/', 0.5],
];

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(([path, pri]) => `  <url>
    <loc>${SITE}/${path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${pri.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(new URL('sitemap.xml', root), sitemap);
console.log(`sitemap.xml — ${URLS.length} URLs`);

// ---------------------------------------------------------------- favicon.ico
// ICO container wrapping the 192px PNG (PNG-in-ICO is valid for <=256px).

const png = readFileSync(new URL('assets/img/icon-192.png', root));
const ico = Buffer.alloc(6 + 16 + png.length);
ico.writeUInt16LE(0, 0);          // reserved
ico.writeUInt16LE(1, 2);          // type: icon
ico.writeUInt16LE(1, 4);          // count
ico.writeUInt8(192, 6);           // width
ico.writeUInt8(192, 7);           // height
ico.writeUInt8(0, 8);             // palette
ico.writeUInt8(0, 9);             // reserved
ico.writeUInt16LE(1, 10);         // planes
ico.writeUInt16LE(32, 12);        // bpp
ico.writeUInt32LE(png.length, 14); // data size
ico.writeUInt32LE(22, 18);        // data offset
png.copy(ico, 22);
writeFileSync(new URL('favicon.ico', root), ico);
console.log('favicon.ico');

// ---------------------------------------------------------------- page polish

const GA4 = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-BSC4V5T85X"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-BSC4V5T85X');</script>`;

const PAGES = [
  'index.html', 'about/index.html',
  'dashboard/index.html', 'rent-receipt/index.html', 'salary-slip/index.html',
  'timesheet/index.html', 'expense-report/index.html', 'letterhead-maker/index.html',
  'payment-reminder/index.html', 'upi-qr-generator/index.html', 'bulk-invoices/index.html',
];

for (const page of PAGES) {
  const url = new URL(page, root);
  let html = readFileSync(url, 'utf8');

  // Swap any commented placeholder for the live snippet; insert if absent.
  html = html.replace(/<!-- GA4 placeholder[\s\S]*?-->\n?/, '');
  if (!html.includes('googletagmanager.com/gtag')) {
    html = html.replace('</head>', `${GA4}\n</head>`);
  }
  // Replace slim footers with the full cross-linked footer.
  html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, FOOTER.trim());
  writeFileSync(url, html);
  console.log(`polished ${page}`);
}
