// Payment reminder generator — three escalation tones with merge fields
// filled from any unpaid invoice in the on-device workspace.

import * as db from './store.js';
import { displayStatus } from './docstatus.js';
import { formatMoney } from './util/money.js';
import { formatDate, todayISO } from './util/dates.js';
import { upiLink } from './util/qr.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  tone: 'friendly',
  client: '', number: '', amount: '', due: '', business: '', upi: '', paypal: '', bank: '',
};

function daysOverdue(due) {
  if (!due) return 0;
  return Math.max(0, Math.floor((new Date(todayISO()) - new Date(due)) / 864e5));
}

function build() {
  const name = state.client || 'there';
  const number = state.number || 'our invoice';
  const amount = state.amount ? formatMoney(+state.amount, state.currency || 'USD') : 'the amount due';
  const due = state.due ? formatDate(state.due) : 'its due date';
  const od = daysOverdue(state.due);
  const biz = state.business || 'us';

  const payLines = [];
  if (state.bank) payLines.push(`Bank transfer: ${state.bank}`);
  if (state.paypal) payLines.push(`PayPal: https://${state.paypal.replace(/^https?:\/\//, '')}`);
  if (state.upi) payLines.push(`UPI (open on your phone): ${upiLink({ upiId: state.upi, name: state.business, amount: +state.amount || 0, note: state.number })}`);
  const payBlock = payLines.length ? `\n\nWays to pay:\n${payLines.join('\n')}` : '';

  let subject = '';
  let body = '';

  if (state.tone === 'friendly') {
    subject = `Friendly reminder — invoice ${state.number || ''}`.trim();
    body = `Hi ${name},

Hope you're doing well! Just a gentle nudge that invoice ${number} for ${amount} ${od > 0 ? `was due on ${due} (${od} day${od === 1 ? '' : 's'} ago)` : `is due on ${due}`}.

If it's already on its way, please ignore this — and thank you! If anything about the invoice is unclear or you need another copy, just reply and I'll sort it out.${payBlock}

Thanks so much,
${biz}`;
  } else if (state.tone === 'firm') {
    subject = `Payment overdue — invoice ${state.number || ''} (${od} days)`.trim();
    body = `Hello ${name},

According to our records, invoice ${number} for ${amount} was due on ${due} and remains unpaid${od > 0 ? ` — now ${od} day${od === 1 ? '' : 's'} overdue` : ''}.

Please arrange payment within the next 7 days, or let us know immediately if there is an issue with the invoice or a payment already in transit.${payBlock}

We appreciate your prompt attention to this.

Regards,
${biz}`;
  } else {
    subject = `FINAL NOTICE — invoice ${state.number || ''} seriously overdue`.trim();
    body = `Dear ${name},

Despite previous reminders, invoice ${number} for ${amount}, due ${due}, remains unpaid — now ${od} day${od === 1 ? '' : 's'} overdue.

Please treat this as a final notice. If full payment is not received within 7 days of this email, we will have to suspend further work and consider additional recovery steps, including late-fee charges as per our agreed terms and referral for collection.

If payment has been made in the last few days, or you wish to discuss a payment plan, contact us immediately so we can resolve this.${payBlock}

Sincerely,
${biz}`;
  }

  $('#out-subject').value = subject;
  $('#out-body').value = body;
}

// ---------- workspace integration ----------
async function loadInvoices() {
  const docs = (await db.all('documents'))
    .filter((d) => (+d.balance || 0) > 0 && ['invoice', 'gst-invoice', 'commercial-invoice'].includes(d.docType))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const sel = $('#pick-invoice');
  if (!docs.length) {
    sel.innerHTML = '<option value="">No unpaid invoices in this browser’s workspace</option>';
    return;
  }
  sel.innerHTML = '<option value="">Fill from a workspace invoice…</option>' + docs.map((d) => {
    const st = displayStatus(d);
    return `<option value="${d.id}">${d.number} — ${d.clientName || 'client'} — ${formatMoney(d.balance, d.currency)} (${st})</option>`;
  }).join('');
  sel.onchange = () => {
    const hit = docs.find((d) => d.id === sel.value);
    if (!hit) return;
    state.client = hit.clientName || '';
    state.number = hit.number;
    state.amount = hit.balance;
    state.currency = hit.currency;
    state.due = hit.dueDate || '';
    state.business = hit.state?.business?.name || '';
    state.upi = hit.state?.payment?.upiId || '';
    state.paypal = hit.state?.payment?.paypal || '';
    state.bank = (hit.state?.payment?.bank || '').split('\n')[0];
    for (const k of ['client', 'number', 'amount', 'due', 'business', 'upi', 'paypal', 'bank']) {
      const el = $(`#f-${k}`);
      if (el) el.value = state[k];
    }
    build();
  };
}

// ---------- wiring ----------
for (const k of ['client', 'number', 'amount', 'due', 'business', 'upi', 'paypal', 'bank']) {
  const el = $(`#f-${k}`);
  el.addEventListener('input', () => { state[k] = el.value; build(); });
}
for (const btn of $$('#tone button')) {
  btn.addEventListener('click', () => {
    $$('#tone button').forEach((b) => b.classList.toggle('active', b === btn));
    state.tone = btn.dataset.v;
    build();
  });
}
$('#copy-body').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('#out-body').value);
  $('#copy-body').textContent = 'Copied!';
  setTimeout(() => { $('#copy-body').textContent = 'Copy email'; }, 1500);
});
$('#copy-subject').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('#out-subject').value);
  $('#copy-subject').textContent = 'Copied!';
  setTimeout(() => { $('#copy-subject').textContent = 'Copy subject'; }, 1500);
});
$('#open-mail').addEventListener('click', () => {
  location.href = `mailto:?subject=${encodeURIComponent($('#out-subject').value)}&body=${encodeURIComponent($('#out-body').value)}`;
});

loadInvoices();
build();
