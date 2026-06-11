// Expense report — dated, categorised expense lines with totals and
// reimbursable amount.

import { Sheet, COLORS, initCustomDoc } from './kit.js';
import { formatMoney, CURRENCIES } from '../util/money.js';
import { todayISO, formatDate } from '../util/dates.js';

const $ = (s) => document.querySelector(s);

const CATEGORIES = ['Travel', 'Meals', 'Lodging', 'Supplies', 'Software', 'Communication', 'Other'];

const state = {
  name: '', company: '', purpose: '', period: '',
  currency: 'USD', advance: 0,
  rows: [{ date: todayISO(), category: 'Travel', description: '', amount: 0 }],
};

const total = () => state.rows.reduce((s, r) => s + (+r.amount || 0), 0);

function layout(measure) {
  const s = new Sheet('a4', measure);
  const money = (v) => formatMoney(v, state.currency, { pdfSafe: true });

  s.text('EXPENSE REPORT', s.left, s.y, 22, 'timesB', COLORS.ink);
  s.y += 32;
  s.hr(COLORS.gold, 0.8);
  s.y += 18;

  const meta = [['Name', state.name], ['Company', state.company], ['Purpose', state.purpose], ['Period', state.period]].filter(([, v]) => v);
  for (const [k, v] of meta) {
    s.text(`${k}:`, s.left, s.y, 9, 'helvB', COLORS.muted);
    s.text(v, s.left + 66, s.y, 9.5, 'helv', COLORS.ink);
    s.y += 16;
  }
  s.y += 12;

  const cols = { date: s.left + 8, cat: s.left + 90, desc: s.left + 185, amount: s.right - 8 };
  function head() {
    s.rect(s.left, s.y - 6, s.contentW, 22, { fill: COLORS.ink });
    s.text('DATE', cols.date, s.y, 8.5, 'helvB', COLORS.white);
    s.text('CATEGORY', cols.cat, s.y, 8.5, 'helvB', COLORS.white);
    s.text('DESCRIPTION', cols.desc, s.y, 8.5, 'helvB', COLORS.white);
    s.text('AMOUNT', cols.amount, s.y, 8.5, 'helvB', COLORS.white, 'right');
    s.y += 28;
  }
  head();

  for (const r of state.rows) {
    const descLines = s.wrap(r.description || '—', 'helv', 9.5, cols.amount - cols.desc - 80);
    const rowH = Math.max(descLines.length * 13.5, 14) + 8;
    if (s.y + rowH > s.H - 100) { s.newPage(); head(); }
    s.text(formatDate(r.date), cols.date, s.y, 9.5, 'helv', COLORS.muted);
    s.text(r.category, cols.cat, s.y, 9.5, 'helv', COLORS.body);
    descLines.forEach((ln, j) => s.text(ln, cols.desc, s.y + j * 13.5, 9.5, 'helv', COLORS.body));
    s.text(money(+r.amount || 0), cols.amount, s.y, 9.5, 'helv', COLORS.ink, 'right');
    s.y += rowH;
    s.hr(COLORS.hairline, 0.5);
    s.y += 8;
  }

  s.y += 8;
  s.text('Total expenses', s.right - 160, s.y, 9.5, 'helvB', COLORS.ink);
  s.text(money(total()), s.right - 8, s.y, 9.5, 'helvB', COLORS.ink, 'right');
  s.y += 17;
  if (+state.advance > 0) {
    s.text('Less: advance received', s.right - 160, s.y, 9.5, 'helv', COLORS.muted);
    s.text(`-${money(+state.advance)}`, s.right - 8, s.y, 9.5, 'helv', COLORS.body, 'right');
    s.y += 17;
  }
  s.rect(s.right - 240, s.y - 7, 240, 26, { fill: COLORS.emerald });
  s.text('REIMBURSABLE', s.right - 232, s.y, 9, 'helvB', COLORS.white);
  s.text(money(total() - (+state.advance || 0)), s.right - 8, s.y, 11, 'helvB', COLORS.white, 'right');
  s.y += 40;

  s.line(s.left, s.y, s.left + 150, s.y, COLORS.hairline, 0.7);
  s.text('Employee signature', s.left + 75, s.y + 6, 8.5, 'helv', COLORS.muted, 'center');
  s.line(s.right - 150, s.y, s.right, s.y, COLORS.hairline, 0.7);
  s.text('Approved by', s.right - 75, s.y + 6, 8.5, 'helv', COLORS.muted, 'center');

  return s.pages;
}

const app = initCustomDoc({
  layout,
  filename: () => `Expense-Report-${(state.name || 'report').replace(/\s+/g, '-')}.pdf`,
});

for (const key of ['name', 'company', 'purpose', 'period', 'advance']) {
  const el = $(`#f-${key}`);
  el.value = state[key];
  el.addEventListener('input', () => {
    state[key] = el.type === 'number' ? +el.value || 0 : el.value;
    app.refresh();
    updateStrip();
  });
}

const curSel = $('#f-currency');
curSel.innerHTML = CURRENCIES.map((c) => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join('');
curSel.value = state.currency;
curSel.addEventListener('input', () => { state.currency = curSel.value; app.refresh(); updateStrip(); });

const rowsEl = $('#exp-rows');
function renderRows() {
  rowsEl.textContent = '';
  state.rows.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'inline-actions';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <input class="e-date" type="date" style="max-width:150px">
      <select class="e-cat" style="max-width:140px">${CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select>
      <input class="e-desc" placeholder="Description">
      <input class="e-amount" type="number" min="0" step="any" style="max-width:110px;text-align:right" placeholder="0.00">
      <button type="button" class="btn btn-quiet btn-sm">×</button>`;
    div.querySelector('.e-date').value = r.date;
    div.querySelector('.e-cat').value = r.category;
    div.querySelector('.e-desc').value = r.description;
    div.querySelector('.e-amount').value = r.amount || '';
    div.querySelector('.e-date').addEventListener('input', (e) => { r.date = e.target.value; app.refresh(); });
    div.querySelector('.e-cat').addEventListener('input', (e) => { r.category = e.target.value; app.refresh(); });
    div.querySelector('.e-desc').addEventListener('input', (e) => { r.description = e.target.value; app.refresh(); });
    div.querySelector('.e-amount').addEventListener('input', (e) => { r.amount = +e.target.value || 0; app.refresh(); updateStrip(); });
    div.querySelector('button').addEventListener('click', () => { state.rows.splice(i, 1); if (!state.rows.length) state.rows.push({ date: todayISO(), category: 'Travel', description: '', amount: 0 }); renderRows(); app.refresh(); updateStrip(); });
    rowsEl.appendChild(div);
  });
}
$('#add-row').addEventListener('click', () => {
  state.rows.push({ date: state.rows.at(-1)?.date || todayISO(), category: 'Travel', description: '', amount: 0 });
  renderRows();
});
renderRows();

function updateStrip() {
  $('#exp-strip').innerHTML = `<span><small>Total</small><strong>${formatMoney(total(), state.currency)}</strong></span>
    <span><small>Reimbursable</small><strong>${formatMoney(total() - (+state.advance || 0), state.currency)}</strong></span>`;
}
updateStrip();
