// Live preview renderer: draws layout primitives as absolutely-positioned DOM
// inside scaled "paper" pages. Measurement uses canvas 2D with font stacks
// matching the PDF's standard fonts, so wrapping tracks the PDF closely.

const FONT_CSS = {
  helv: ['400', 'normal', 'Helvetica, Arial, sans-serif'],
  helvB: ['700', 'normal', 'Helvetica, Arial, sans-serif'],
  helvO: ['400', 'italic', 'Helvetica, Arial, sans-serif'],
  times: ['400', 'normal', '"Times New Roman", Times, serif'],
  timesB: ['700', 'normal', '"Times New Roman", Times, serif'],
  timesI: ['400', 'italic', '"Times New Roman", Times, serif'],
  cour: ['400', 'normal', '"Courier New", Courier, monospace'],
  courB: ['700', 'normal', '"Courier New", Courier, monospace'],
};

const ctx = document.createElement('canvas').getContext('2d');

export function canvasMeasure(text, font, size) {
  const [weight, style, family] = FONT_CSS[font] || FONT_CSS.helv;
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  return ctx.measureText(text).width;
}

function fontStyle(el, font, size) {
  const [weight, style, family] = FONT_CSS[font] || FONT_CSS.helv;
  el.style.fontWeight = weight;
  el.style.fontStyle = style;
  el.style.fontFamily = family;
  el.style.fontSize = `${size}px`;
}

export function renderPreview(container, layoutResult) {
  container.textContent = '';
  for (const page of layoutResult.pages) {
    const pageEl = document.createElement('div');
    pageEl.className = 'pv-page';
    pageEl.style.width = `${page.w}px`;
    pageEl.style.height = `${page.h}px`;

    for (const p of page.prims) {
      if (p.t === 'rect') {
        const el = document.createElement('div');
        el.className = 'pv-abs';
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.width = `${p.w}px`;
        el.style.height = `${p.h}px`;
        if (p.fill) el.style.background = p.fill;
        if (p.stroke) el.style.border = `${p.lineW || 1}px solid ${p.stroke}`;
        pageEl.appendChild(el);
      } else if (p.t === 'line') {
        const el = document.createElement('div');
        el.className = 'pv-abs';
        const horizontal = Math.abs(p.y2 - p.y1) < 0.01;
        if (horizontal) {
          el.style.left = `${Math.min(p.x1, p.x2)}px`;
          el.style.top = `${p.y1 - (p.w || 1) / 2}px`;
          el.style.width = `${Math.abs(p.x2 - p.x1)}px`;
          el.style.height = `${p.w || 1}px`;
        } else {
          el.style.left = `${p.x1 - (p.w || 1) / 2}px`;
          el.style.top = `${Math.min(p.y1, p.y2)}px`;
          el.style.width = `${p.w || 1}px`;
          el.style.height = `${Math.abs(p.y2 - p.y1)}px`;
        }
        el.style.background = p.color;
        pageEl.appendChild(el);
      } else if (p.t === 'text') {
        const el = document.createElement('div');
        el.className = 'pv-abs pv-text';
        fontStyle(el, p.font, p.size);
        el.style.color = p.color;
        el.style.top = `${p.y}px`;
        el.textContent = p.text;
        if (p.align === 'right') {
          el.style.left = `${p.x}px`;
          el.style.transform = 'translateX(-100%)';
        } else if (p.align === 'center') {
          el.style.left = `${p.x}px`;
          el.style.transform = 'translateX(-50%)';
        } else {
          el.style.left = `${p.x}px`;
        }
        pageEl.appendChild(el);
      } else if (p.t === 'image') {
        const el = document.createElement('img');
        el.className = 'pv-abs';
        el.src = p.src;
        el.alt = '';
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.width = `${p.w}px`;
        el.style.height = `${p.h}px`;
        el.style.objectFit = 'contain';
        el.style.objectPosition = 'left top';
        pageEl.appendChild(el);
      }
    }
    container.appendChild(pageEl);
  }
  fitPreview(container);
}

// Scale pages to the container width (pages keep their pt-based aspect).
export function fitPreview(container) {
  const pages = container.querySelectorAll('.pv-page');
  if (!pages.length) return;
  const cs = getComputedStyle(container);
  const available = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  for (const pageEl of pages) {
    const w = parseFloat(pageEl.style.width);
    const h = parseFloat(pageEl.style.height);
    const scale = Math.min(available / w, 1.4);
    pageEl.style.transform = `scale(${scale})`;
    pageEl.style.transformOrigin = 'top left';
    pageEl.style.marginBottom = `${h * (scale - 1) + 18}px`;
  }
}
