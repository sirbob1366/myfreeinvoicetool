(async () => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('[data-bind="business.name"]', 'Acme Studio');
  set('[data-bind="client.name"]', 'Globex Corporation');
  set('.i-desc', 'Consulting retainer');
  set('.i-qty', '4');
  set('.i-rate', '250');
  set('[data-bind="taxMode"]', 'single');
  set('[data-bind="taxPct"]', '10');
  // make it overdue so the dashboard auto-flags it
  set('[data-bind="issueDate"]', '2026-04-01');
  document.querySelector('#terms-preset').value = 'net7';
  document.querySelector('#terms-preset').dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  document.querySelector('#save-doc').click();
  await new Promise((r) => setTimeout(r, 700));
  const db = await import('/assets/js/store.js');
  const docs = await db.all('documents');
  const businesses = await db.all('businesses');
  return {
    docs: docs.map((d) => ({ number: d.number, total: d.total, balance: d.balance, status: d.status, due: d.dueDate })),
    businesses: businesses.map((b) => ({ name: b.name, seq: b.sequences })),
  };
})()
