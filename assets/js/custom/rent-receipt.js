// Rent receipt generator with India HRA mode: one receipt per month for a
// date range, landlord PAN, revenue-stamp box for cash payments.

import { Sheet, COLORS, initCustomDoc } from './kit.js';
import { formatMoney } from '../util/money.js';
import { amountInWords } from '../util/words.js';

const $ = (s) => document.querySelector(s);

const state = {
  tenant: '', landlord: '', pan: '', address: '', place: '',
  rent: 0, from: defaultMonth(-2), to: defaultMonth(0),
  mode: 'Bank transfer', currency: 'INR', signature: '',
};

function defaultMonth(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthsInRange(from, to) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out = [];
  let y = fy; let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(new Date(y, m - 1, 1));
    m++;
    if (m > 12) { m = 1; y++; }
    if (out.length > 36) break; // 3-year cap, sanity
  }
  return out;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function layout(measure) {
  const sheet = new Sheet('a4', measure);
  const months = monthsInRange(state.from, state.to);
  const money = formatMoney(+state.rent || 0, state.currency, { pdfSafe: true });
  const words = amountInWords(+state.rent || 0, state.currency, 'indian');
  const isCash = state.mode === 'Cash';

  months.forEach((month, i) => {
    if (i > 0) sheet.newPage();
    const s = sheet;
    const monthName = `${MONTHS[month.getMonth()]} ${month.getFullYear()}`;
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const dateStr = lastDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    s.y = 64;
    s.text('RENT RECEIPT', s.W / 2, s.y, 22, 'timesB', COLORS.ink, 'center');
    s.y += 30;
    s.text(monthName, s.W / 2, s.y, 11, 'helv', COLORS.muted, 'center');
    s.y += 24;
    s.line(s.left + 60, s.y, s.right - 60, s.y, COLORS.gold, 0.8);
    s.y += 26;

    s.text(`Receipt No: RR-${String(i + 1).padStart(3, '0')}`, s.left, s.y, 10, 'helv', COLORS.body);
    s.text(`Date: ${dateStr}`, s.right, s.y, 10, 'helv', COLORS.body, 'right');
    s.y += 30;

    const sentence = `Received with thanks from ${state.tenant || '____________'} the sum of ${money} (${words}) towards rent for the month of ${monthName} for the property located at ${state.address || '____________'}, paid by ${state.mode.toLowerCase()}.`;
    s.para(sentence, s.left, 11.5, 'times', COLORS.ink, s.contentW, 19);
    s.y += 18;

    s.text(`Landlord: ${state.landlord || '____________'}`, s.left, s.y, 10.5, 'helv', COLORS.body);
    s.y += 16;
    if (state.pan) {
      s.text(`Landlord PAN: ${state.pan}`, s.left, s.y, 10.5, 'helv', COLORS.body);
      s.y += 16;
    }
    if (state.place) {
      s.text(`Place: ${state.place}`, s.left, s.y, 10.5, 'helv', COLORS.body);
      s.y += 16;
    }

    // Signature + revenue stamp zone
    const zoneY = s.y + 46;
    if (isCash) {
      s.rect(s.left, zoneY - 8, 90, 70, { stroke: COLORS.hairline, lineW: 0.8 });
      s.text('Affix revenue', s.left + 45, zoneY + 18, 7.5, 'helv', COLORS.faint, 'center');
      s.text('stamp (Re. 1)', s.left + 45, zoneY + 28, 7.5, 'helv', COLORS.faint, 'center');
    }
    if (state.signature) {
      s.image(state.signature, s.right - 150, zoneY - 8, 150, 46);
    }
    s.line(s.right - 160, zoneY + 50, s.right, zoneY + 50, COLORS.hairline, 0.7);
    s.text('Signature of landlord', s.right - 80, zoneY + 56, 8.5, 'helv', COLORS.muted, 'center');

    if (isCash && +state.rent > 5000) {
      s.y = zoneY + 86;
      s.text('Note: A revenue stamp is required on rent receipts for cash payments above Rs. 5,000.', s.left, s.y, 8.5, 'helvO', COLORS.faint);
    }
  });

  return sheet.pages;
}

const binds = ['tenant', 'landlord', 'pan', 'address', 'place', 'rent', 'from', 'to', 'mode'];

const app = initCustomDoc({
  layout,
  filename: () => `Rent-Receipts-${state.from}-to-${state.to}.pdf`,
});

for (const key of binds) {
  const el = $(`#f-${key}`);
  if (!el) continue;
  el.value = state[key];
  el.addEventListener('input', () => {
    state[key] = el.type === 'number' ? +el.value || 0 : el.value;
    app.refresh();
  });
}

$('#sig-upload').addEventListener('change', () => {
  const f = $('#sig-upload').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { state.signature = r.result; app.refresh(); };
  r.readAsDataURL(f);
});
$('#sig-clear').addEventListener('click', () => {
  state.signature = '';
  $('#sig-upload').value = '';
  app.refresh();
});
