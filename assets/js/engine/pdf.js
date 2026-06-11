// PDF renderer: layout primitives -> pdf-lib vector output (never rasterized).
// pdf-lib is loaded lazily on first use so generator pages stay fast.

import { layoutDocument } from './layout.js';

let pdfLibPromise = null;

function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (pdfLibPromise) return pdfLibPromise;
  pdfLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/vendor/pdf-lib/pdf-lib.min.js';
    s.onload = () => resolve(window.PDFLib);
    s.onerror = () => reject(new Error('Could not load the PDF library.'));
    document.head.appendChild(s);
  });
  return pdfLibPromise;
}

// WinAnsi (cp1252) safety until a Unicode font is embedded (Stage 3): map the
// characters the standard fonts can't encode to close equivalents.
const CHAR_MAP = {
  ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', '⁠': '',
  '₹': 'Rs.', '₨': 'Rs.', '₱': 'PHP ', '₩': 'KRW ',
  '₪': 'ILS ', '₫': 'VND ', '฿': 'THB ', '₦': 'NGN ',
  '₴': 'UAH ', '₺': 'TL ', '₽': 'RUB ', '৳': 'Tk ',
  '−': '-',
};
const WINANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

function winAnsi(text) {
  let out = '';
  for (const ch of String(text)) {
    if (ch in CHAR_MAP) { out += CHAR_MAP[ch]; continue; }
    const code = ch.codePointAt(0);
    if (code <= 0xff || WINANSI_EXTRA.has(ch)) out += ch;
    else out += '?';
  }
  return out;
}

function hexToRgb(hex, rgb) {
  const m = /^#?([0-9a-f]{6})/i.exec(hex || '');
  const v = m ? parseInt(m[1], 16) : 0;
  return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

async function dataUrlBytes(dataUrl) {
  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}

// Generate the PDF for a document state. Returns Uint8Array.
export async function renderPDF(doc) {
  const PDFLib = await loadPdfLib();
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('myfreeinvoicetool.com');
  pdfDoc.setCreator('myfreeinvoicetool.com');

  const fonts = {
    helv: await pdfDoc.embedFont(StandardFonts.Helvetica),
    helvB: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    helvO: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesB: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesI: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    cour: await pdfDoc.embedFont(StandardFonts.Courier),
    courB: await pdfDoc.embedFont(StandardFonts.CourierBold),
  };

  const measure = (text, font, size) =>
    (fonts[font] || fonts.helv).widthOfTextAtSize(winAnsi(text), size);

  // Re-run layout with the PDF's own metrics so wraps are exact.
  const { pages } = layoutDocument(doc, measure);

  const imageCache = new Map();
  async function embedImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const bytes = await dataUrlBytes(src);
    let img;
    if (src.startsWith('data:image/png')) img = await pdfDoc.embedPng(bytes);
    else if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) img = await pdfDoc.embedJpg(bytes);
    else {
      // Re-encode anything else (e.g. webp/svg logos) through a canvas.
      img = await pdfDoc.embedPng(await reencodeToPng(src));
    }
    imageCache.set(src, img);
    return img;
  }

  for (const page of pages) {
    const pg = pdfDoc.addPage([page.w, page.h]);
    const H = page.h;
    for (const p of page.prims) {
      if (p.t === 'rect') {
        pg.drawRectangle({
          x: p.x, y: H - p.y - p.h, width: p.w, height: p.h,
          color: p.fill ? hexToRgb(p.fill, rgb) : undefined,
          borderColor: p.stroke ? hexToRgb(p.stroke, rgb) : undefined,
          borderWidth: p.stroke ? (p.lineW || 1) : undefined,
        });
      } else if (p.t === 'line') {
        pg.drawLine({
          start: { x: p.x1, y: H - p.y1 },
          end: { x: p.x2, y: H - p.y2 },
          color: hexToRgb(p.color, rgb),
          thickness: p.w || 1,
        });
      } else if (p.t === 'text') {
        const font = fonts[p.font] || fonts.helv;
        const text = winAnsi(p.text);
        let x = p.x;
        if (p.align === 'right') x = p.x - font.widthOfTextAtSize(text, p.size);
        else if (p.align === 'center') x = p.x - font.widthOfTextAtSize(text, p.size) / 2;
        // layout y = top of line box; PDF wants the baseline.
        const baseline = H - p.y - p.size * 0.78;
        pg.drawText(text, { x, y: baseline, size: p.size, font, color: hexToRgb(p.color, rgb) });
      } else if (p.t === 'image') {
        try {
          const img = await embedImage(p.src);
          const scale = Math.min(p.w / img.width, p.h / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          pg.drawImage(img, { x: p.x, y: H - p.y - h, width: w, height: h });
        } catch {
          // Skip images that fail to embed rather than failing the whole PDF.
        }
      }
    }
  }

  return pdfDoc.save();
}

function reencodeToPng(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error('encode failed'));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = src;
  });
}
