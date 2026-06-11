// Salary slip generator — Indian and generic modes, earnings/deductions
// columns, net pay with amount in words.

import { Sheet, COLORS, initCustomDoc } from './kit.js';
import { formatMoney } from '../util/money.js';
import { amountInWords } from '../util/words.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  company: '', address: '', logo: '',
  employee: '', empId: '', designation: '', department: '',
  month: defaultMonth(), daysPaid: 30, mode: 'indian', currency: 'INR',
  earnings: [
    { label: 'Basic salary', amount: 0 },
    { label: 'House rent allowance (HRA)', amount: 0 },
    { label: 'Conveyance allowance', amount: 0 },
    { label: 'Special allowance', amount: 0 },
  ],
  deductions: [
    { label: 'Provident fund (PF)', amount: 0 },
    { label: 'Professional tax', amount: 0 },
    { label: 'Income tax (TDS)', amount: 0 },
  ],
};

function defaultMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthName(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}

function totals() {
  const earn = state.earnings.reduce((s, r) => s + (+r.amount || 0), 0);
  const ded = state.deductions.reduce((s, r) => s + (+r.amount || 0), 0);
  return { earn, ded, net: earn - ded };
}

function layout(measure) {
  const s = new Sheet('a4', measure);
  const money = (v) => formatMoney(v, state.currency, { pdfSafe: true });
  const { earn, ded, net } = totals();

  // Header
  if (state.logo) { s.image(state.logo, s.left, s.y, 52, 52); }
  const hx = state.logo ? s.left + 64 : s.left;
  s.text(state.company || 'Company name', hx, s.y + 4, 16, 'helvB', COLORS.ink);
  if (state.address) {
    s.wrap(state.address.replace(/\n/g, ', '), 'helv', 8.5, s.contentW - 80).forEach((ln, i) => {
      s.text(ln, hx, s.y + 26 + i * 12, 8.5, 'helv', COLORS.muted);
    });
  }
  s.y += 64;
  s.hr(COLORS.gold, 0.8);
  s.y += 18;
  s.text(`SALARY SLIP — ${monthName(state.month).toUpperCase()}`, s.W / 2, s.y, 13, 'helvB', COLORS.ink, 'center');
  s.y += 30;

  // Employee meta
  const meta = [
    ['Employee', state.employee], ['Employee ID', state.empId],
    ['Designation', state.designation], ['Department', state.department],
    ['Days paid', String(state.daysPaid || '')], ['Pay period', monthName(state.month)],
  ].filter(([, v]) => v);
  const colW = s.contentW / 2;
  meta.forEach(([k, v], i) => {
    const x = s.left + (i % 2) * colW;
    const yy = s.y + Math.floor(i / 2) * 17;
    s.text(`${k}:`, x, yy, 9, 'helvB', COLORS.muted);
    s.text(v, x + 80, yy, 9.5, 'helv', COLORS.ink);
  });
  s.y += Math.ceil(meta.length / 2) * 17 + 20;

  // Earnings / deductions two-column table
  const half = s.contentW / 2 - 10;
  const leftX = s.left;
  const rightX = s.left + half + 20;
  const startY = s.y;

  s.rect(leftX, startY - 6, half, 22, { fill: COLORS.ink });
  s.rect(rightX, startY - 6, half, 22, { fill: COLORS.ink });
  s.text('EARNINGS', leftX + 8, startY, 8.5, 'helvB', COLORS.white);
  s.text('AMOUNT', leftX + half - 8, startY, 8.5, 'helvB', COLORS.white, 'right');
  s.text('DEDUCTIONS', rightX + 8, startY, 8.5, 'helvB', COLORS.white);
  s.text('AMOUNT', rightX + half - 8, startY, 8.5, 'helvB', COLORS.white, 'right');

  let ly = startY + 28;
  let ry = startY + 28;
  for (const row of state.earnings) {
    if (!row.label) continue;
    s.text(row.label, leftX + 8, ly, 9.5, 'helv', COLORS.body);
    s.text(money(+row.amount || 0), leftX + half - 8, ly, 9.5, 'helv', COLORS.ink, 'right');
    ly += 18;
  }
  for (const row of state.deductions) {
    if (!row.label) continue;
    s.text(row.label, rightX + 8, ry, 9.5, 'helv', COLORS.body);
    s.text(money(+row.amount || 0), rightX + half - 8, ry, 9.5, 'helv', COLORS.ink, 'right');
    ry += 18;
  }
  const tY = Math.max(ly, ry) + 6;
  s.line(leftX, tY - 12, leftX + half, tY - 12, COLORS.hairline, 0.6);
  s.line(rightX, tY - 12, rightX + half, tY - 12, COLORS.hairline, 0.6);
  s.text('Gross earnings', leftX + 8, tY, 9.5, 'helvB', COLORS.ink);
  s.text(money(earn), leftX + half - 8, tY, 9.5, 'helvB', COLORS.ink, 'right');
  s.text('Total deductions', rightX + 8, tY, 9.5, 'helvB', COLORS.ink);
  s.text(money(ded), rightX + half - 8, tY, 9.5, 'helvB', COLORS.ink, 'right');

  // Net pay band
  s.y = tY + 30;
  s.rect(s.left, s.y - 8, s.contentW, 30, { fill: COLORS.emerald });
  s.text('NET PAY', s.left + 10, s.y + 1, 10, 'helvB', COLORS.white);
  s.text(money(net), s.right - 10, s.y, 12, 'helvB', COLORS.white, 'right');
  s.y += 40;

  const words = amountInWords(net, state.currency, state.mode === 'indian' ? 'indian' : 'western');
  s.para(`Net pay in words: ${words}`, s.left, 9, 'helvO', COLORS.body, s.contentW);
  s.y += 24;
  s.text('This is a computer-generated salary slip and does not require a signature.', s.left, s.y, 8, 'helv', COLORS.faint);

  return s.pages;
}

// ---------- form wiring ----------
const scalarBinds = ['company', 'address', 'employee', 'empId', 'designation', 'department', 'month', 'daysPaid', 'mode'];

function rowEditor(containerSel, rows, addSel) {
  const container = $(containerSel);
  function render() {
    container.textContent = '';
    rows.forEach((row, i) => {
      const div = document.createElement('div');
      div.className = 'inline-actions';
      div.style.marginBottom = '8px';
      div.innerHTML = `
        <input class="r-label" placeholder="Label" value="">
        <input class="r-amount" type="number" min="0" step="any" style="max-width:130px;text-align:right" placeholder="0">
        <button type="button" class="btn btn-quiet btn-sm">×</button>`;
      div.querySelector('.r-label').value = row.label;
      div.querySelector('.r-amount').value = row.amount || '';
      div.querySelector('.r-label').addEventListener('input', (e) => { row.label = e.target.value; app.refresh(); });
      div.querySelector('.r-amount').addEventListener('input', (e) => { row.amount = +e.target.value || 0; app.refresh(); updateNet(); });
      div.querySelector('button').addEventListener('click', () => { rows.splice(i, 1); render(); app.refresh(); updateNet(); });
      container.appendChild(div);
    });
  }
  $(addSel).addEventListener('click', () => { rows.push({ label: '', amount: 0 }); render(); });
  render();
}

function updateNet() {
  const { earn, ded, net } = totals();
  const el = $('#net-strip');
  if (el) el.innerHTML = `<span><small>Gross</small><strong>${formatMoney(earn, state.currency)}</strong></span>
    <span><small>Deductions</small><strong>${formatMoney(ded, state.currency)}</strong></span>
    <span><small>Net pay</small><strong>${formatMoney(net, state.currency)}</strong></span>`;
}

const app = initCustomDoc({
  layout,
  filename: () => `Salary-Slip-${(state.employee || 'employee').replace(/\s+/g, '-')}-${state.month}.pdf`,
});

for (const key of scalarBinds) {
  const el = $(`#f-${key}`);
  if (!el) continue;
  el.value = state[key];
  el.addEventListener('input', () => {
    state[key] = el.type === 'number' ? +el.value || 0 : el.value;
    app.refresh();
  });
}

$('#logo-input').addEventListener('change', () => {
  const f = $('#logo-input').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { state.logo = r.result; app.refresh(); };
  r.readAsDataURL(f);
});
$('#logo-clear').addEventListener('click', () => { state.logo = ''; $('#logo-input').value = ''; app.refresh(); });

rowEditor('#earnings-rows', state.earnings, '#add-earning');
rowEditor('#deductions-rows', state.deductions, '#add-deduction');
updateNet();
