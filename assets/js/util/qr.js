// UPI QR generation. Wraps the self-hosted qrcode-generator lib (lazy-loaded)
// and emits a PNG dataURL ready for both the DOM preview and pdf-lib.

let qrLibPromise = null;

function loadQrLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (qrLibPromise) return qrLibPromise;
  qrLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/vendor/qrcode/qrcode.js';
    s.onload = () => resolve(window.qrcode);
    s.onerror = () => reject(new Error('Could not load QR library'));
    document.head.appendChild(s);
  });
  return qrLibPromise;
}

// upi://pay deep link per NPCI spec: pa = VPA, pn = payee name, am = amount, cu = INR
export function upiLink({ upiId, name, amount, note }) {
  const p = new URLSearchParams();
  p.set('pa', upiId);
  if (name) p.set('pn', name);
  if (amount > 0) p.set('am', amount.toFixed(2));
  p.set('cu', 'INR');
  if (note) p.set('tn', note.slice(0, 50));
  return `upi://pay?${p.toString()}`;
}

const cache = new Map();

export async function qrDataURL(text, sizePx = 320) {
  const key = `${text}|${sizePx}`;
  if (cache.has(key)) return cache.get(key);
  const qrcode = await loadQrLib();
  const qr = qrcode(0, 'M'); // type 0 = auto-size
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const cell = Math.max(2, Math.floor(sizePx / (count + 8)));
  const margin = cell * 4;
  const size = count * cell + margin * 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#11233f';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell);
    }
  }
  const url = canvas.toDataURL('image/png');
  if (cache.size > 40) cache.clear();
  cache.set(key, url);
  return url;
}
