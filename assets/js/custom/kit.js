// Sheet: a tiny page builder over the engine's drawing primitives, used by
// the custom documents (rent receipts, salary slips, timesheets, expense
// reports, letterheads). Same primitives -> same preview + PDF renderers.

import { PAGE_SIZES, COLORS } from '../engine/layout.js';

export { COLORS };
export const MARGIN = 48;

export class Sheet {
  constructor(pageSize = 'a4', measure) {
    const pg = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
    this.W = pg.w;
    this.H = pg.h;
    this.measure = measure;
    this.left = MARGIN;
    this.right = this.W - MARGIN;
    this.contentW = this.right - this.left;
    this.pages = [];
    this.prims = null;
    this.y = 0;
    this.newPage();
  }

  newPage() {
    this.prims = [];
    this.pages.push({ w: this.W, h: this.H, prims: this.prims });
    this.y = MARGIN;
  }

  ensure(h) {
    if (this.y + h > this.H - MARGIN) this.newPage();
  }

  text(str, x, y, size, font, color, align = 'left') {
    this.prims.push({ t: 'text', x, y, size, font, color, text: String(str), align });
  }

  wrap(str, font, size, maxW) {
    const out = [];
    for (const rawLine of String(str ?? '').split('\n')) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); continue; }
      let line = '';
      for (const word of words) {
        const probe = line ? `${line} ${word}` : word;
        if (this.measure(probe, font, size) <= maxW || !line) line = probe;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out.length ? out : [''];
  }

  // Wrapped paragraph at the cursor; advances y. Returns height used.
  para(str, x, size, font, color, maxW, lineH, align = 'left') {
    const lh = lineH || size * 1.45;
    const lines = this.wrap(str, font, size, maxW);
    for (const ln of lines) {
      this.ensure(lh);
      this.text(ln, x, this.y, size, font, color, align);
      this.y += lh;
    }
    return lines.length * lh;
  }

  hr(color = COLORS.hairline, w = 0.6, x1 = this.left, x2 = this.right) {
    this.prims.push({ t: 'line', x1, y1: this.y, x2, y2: this.y, color, w });
  }

  line(x1, y1, x2, y2, color, w = 0.6) {
    this.prims.push({ t: 'line', x1, y1, x2, y2, color, w });
  }

  rect(x, y, w, h, opts = {}) {
    this.prims.push({ t: 'rect', x, y, w, h, fill: opts.fill, stroke: opts.stroke, lineW: opts.lineW });
  }

  image(src, x, y, w, h) {
    this.prims.push({ t: 'image', x, y, w, h, src });
  }
}

// Shared boot for a custom-document page: live preview + PDF download.
import { renderPreview, fitPreview, canvasMeasure } from '../engine/preview.js';
import { renderPagesPDF } from '../engine/pdf.js';
import { downloadBlob } from '../store.js';

export function initCustomDoc({ layout, filename }) {
  const previewEl = document.querySelector('#preview');
  let queued = false;

  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      try {
        renderPreview(previewEl, { pages: layout(canvasMeasure) });
      } catch (e) {
        console.error(e);
      }
    });
  }

  const btn = document.querySelector('#download-pdf');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const was = btn.textContent;
    btn.textContent = 'Preparing PDF…';
    try {
      const bytes = await renderPagesPDF((measure) => layout(measure));
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), filename());
    } catch (e) {
      console.error(e);
      alert('Sorry — the PDF could not be generated.');
    } finally {
      btn.disabled = false;
      btn.textContent = was;
    }
  });

  for (const tab of document.querySelectorAll('.gen-tab')) {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gen-tab').forEach((b) => b.classList.toggle('active', b === tab));
      document.body.classList.toggle('show-preview', tab.dataset.tab === 'preview');
      fitPreview(previewEl);
    });
  }
  window.addEventListener('resize', () => fitPreview(previewEl));

  refresh();
  return { refresh };
}
