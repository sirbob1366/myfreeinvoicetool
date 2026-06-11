// Weekly timesheet — grid of days, hours and notes; optional rate; one-click
// conversion to an invoice in the workspace.

import { Sheet, COLORS, initCustomDoc } from './kit.js';
import { formatMoney } from '../util/money.js';
import { todayISO, addDays, formatDate } from '../util/dates.js';
import { blankDocument, blankItem, compute } from '../engine/model.js';
import * as db from '../store.js';

const $ = (s) => document.querySelector(s);

function mondayOf(iso) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

const state = {
  name: '', client: '', project: '', rate: 0, currency: 'USD',
  week: mondayOf(todayISO()),
  days: Array.from({ length: 7 }, () => ({ hours: 0, note: '' })),
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const totalHours = () => state.days.reduce((s, d) => s + (+d.hours || 0), 0);

function layout(measure) {
  const s = new Sheet('a4', measure);
  const money = (v) => formatMoney(v, state.currency, { pdfSafe: true });

  s.text('TIMESHEET', s.left, s.y, 22, 'timesB', COLORS.ink);
  s.text(`Week of ${formatDate(state.week)}`, s.right, s.y + 6, 10, 'helv', COLORS.muted, 'right');
  s.y += 34;
  s.hr(COLORS.gold, 0.8);
  s.y += 18;

  const meta = [['Name', state.name], ['Client', state.client], ['Project', state.project]].filter(([, v]) => v);
  for (const [k, v] of meta) {
    s.text(`${k}:`, s.left, s.y, 9, 'helvB', COLORS.muted);
    s.text(v, s.left + 60, s.y, 9.5, 'helv', COLORS.ink);
    s.y += 16;
  }
  s.y += 12;

  // table head
  const cols = { day: s.left, date: s.left + 110, note: s.left + 190, hours: s.right - 8 };
  s.rect(s.left, s.y - 6, s.contentW, 22, { fill: COLORS.ink });
  s.text('DAY', cols.day + 8, s.y, 8.5, 'helvB', COLORS.white);
  s.text('DATE', cols.date, s.y, 8.5, 'helvB', COLORS.white);
  s.text('WORK', cols.note, s.y, 8.5, 'helvB', COLORS.white);
  s.text('HOURS', cols.hours, s.y, 8.5, 'helvB', COLORS.white, 'right');
  s.y += 28;

  state.days.forEach((d, i) => {
    const dateIso = addDays(state.week, i);
    const noteLines = s.wrap(d.note || '—', 'helv', 9.5, cols.hours - cols.note - 30);
    s.text(DAYS[i], cols.day + 8, s.y, 9.5, 'helvB', COLORS.body);
    s.text(formatDate(dateIso), cols.date, s.y, 9.5, 'helv', COLORS.muted);
    noteLines.forEach((ln, j) => s.text(ln, cols.note, s.y + j * 13.5, 9.5, 'helv', COLORS.body));
    s.text((+d.hours || 0).toString(), cols.hours, s.y, 9.5, 'helv', COLORS.ink, 'right');
    s.y += Math.max(noteLines.length * 13.5, 14) + 8;
    s.hr(COLORS.hairline, 0.5);
    s.y += 8;
  });

  s.y += 8;
  s.text('Total hours', s.right - 120, s.y, 10, 'helvB', COLORS.ink);
  s.text(String(+totalHours().toFixed(2)), s.right - 8, s.y, 11, 'helvB', COLORS.ink, 'right');
  s.y += 20;
  if (+state.rate > 0) {
    s.text(`Rate ${money(+state.rate)}/hour`, s.right - 120, s.y, 9, 'helv', COLORS.muted);
    s.y += 16;
    s.rect(s.right - 230, s.y - 7, 230, 26, { fill: COLORS.emerald });
    s.text('AMOUNT DUE', s.right - 222, s.y, 9, 'helvB', COLORS.white);
    s.text(money(totalHours() * +state.rate), s.right - 8, s.y, 11, 'helvB', COLORS.white, 'right');
    s.y += 30;
  }

  return s.pages;
}

const app = initCustomDoc({
  layout,
  filename: () => `Timesheet-${state.week}.pdf`,
});

for (const key of ['name', 'client', 'project', 'rate', 'week']) {
  const el = $(`#f-${key}`);
  el.value = state[key];
  el.addEventListener('input', () => {
    state[key] = el.type === 'number' ? +el.value || 0 : el.value;
    if (key === 'week' && el.value) state.week = mondayOf(el.value);
    renderDayDates();
    app.refresh();
  });
}

function renderDayDates() {
  document.querySelectorAll('.ts-date').forEach((el, i) => {
    el.textContent = formatDate(addDays(state.week, i));
  });
}

const rowsEl = $('#day-rows');
state.days.forEach((d, i) => {
  const row = document.createElement('div');
  row.className = 'inline-actions';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <span style="min-width:86px;font-size:13px;font-weight:600;color:var(--ink)">${DAYS[i]}<br><small class="ts-date muted" style="font-weight:400"></small></span>
    <input class="d-note" placeholder="What did you work on?">
    <input class="d-hours" type="number" min="0" max="24" step="0.25" style="max-width:90px;text-align:right" placeholder="0">`;
  row.querySelector('.d-note').addEventListener('input', (e) => { d.note = e.target.value; app.refresh(); });
  row.querySelector('.d-hours').addEventListener('input', (e) => { d.hours = +e.target.value || 0; updateStrip(); app.refresh(); });
  rowsEl.appendChild(row);
});
renderDayDates();

function updateStrip() {
  const el = $('#hours-strip');
  const amt = totalHours() * (+state.rate || 0);
  el.innerHTML = `<span><small>Total hours</small><strong>${totalHours()}</strong></span>` +
    (+state.rate > 0 ? `<span><small>Amount</small><strong>${formatMoney(amt, state.currency)}</strong></span>` : '');
}
updateStrip();

// Convert to invoice: creates a workspace invoice with hours×rate items.
$('#to-invoice').addEventListener('click', async () => {
  const doc = blankDocument('invoice');
  doc.itemMode = 'hours';
  doc.client.name = state.client;
  doc.items = state.days
    .map((d, i) => ({ ...blankItem(), description: `${DAYS[i]} ${formatDate(addDays(state.week, i))}${d.note ? ` — ${d.note}` : ''}`, qty: +d.hours || 0, rate: +state.rate || 0 }))
    .filter((it) => it.qty > 0);
  if (!doc.items.length) { alert('Add some hours first.'); return; }
  doc.business.name = state.name;
  doc.currency = state.currency;
  doc.notes = `Timesheet for week of ${formatDate(state.week)} — ${totalHours()} hours.`;
  const totals = compute(doc);
  const id = db.uid('doc_');
  await db.put('documents', {
    id, docType: 'invoice', businessId: '', number: doc.number, status: 'Draft',
    issueDate: doc.issueDate, dueDate: doc.dueDate, clientName: doc.client.name,
    currency: doc.currency, total: totals.total, balance: totals.balance, ledger: [],
    updatedAt: new Date().toISOString(), state: JSON.parse(JSON.stringify(doc)),
  });
  location.href = `/invoice/?doc=${id}`;
});
