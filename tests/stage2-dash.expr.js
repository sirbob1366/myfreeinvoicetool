(async () => {
  await new Promise((r) => setTimeout(r, 500));
  const out = {};
  const row = document.querySelector('#docs-body tr[data-id]');
  out.rowFound = !!row;
  if (!row) return out;
  out.badge = row.querySelector('.badge')?.textContent;
  out.cells = [...row.querySelectorAll('td')].slice(0, 7).map((td) => td.textContent.trim());
  out.revenueCards = [...document.querySelectorAll('.rev-card strong')].map((s) => s.textContent);

  // record a partial payment through the ledger dialog
  row.querySelector('[data-act="ledger"]').click();
  await new Promise((r) => setTimeout(r, 300));
  document.querySelector('#ledger-amount').value = '500';
  document.querySelector('#ledger-add').click();
  await new Promise((r) => setTimeout(r, 600));
  out.ledgerBalanceText = document.querySelector('#ledger-balance').textContent;
  document.querySelector('#ledger-close').click();
  await new Promise((r) => setTimeout(r, 300));
  const row2 = document.querySelector('#docs-body tr[data-id]');
  out.badgeAfterPartial = row2.querySelector('.badge')?.textContent;

  // mark paid
  row2.querySelector('[data-act="paid"]')?.click();
  await new Promise((r) => setTimeout(r, 600));
  const row3 = document.querySelector('#docs-body tr[data-id]');
  out.badgeAfterPaid = row3.querySelector('.badge')?.textContent;
  out.convertButtons = [...row3.querySelectorAll('[data-act="convert"]')].map((b) => b.textContent.trim());

  const db = await import('/assets/js/store.js');
  const docs = await db.all('documents');
  out.finalDocs = docs.map((d) => ({ number: d.number, balance: d.balance, status: d.status, ledger: (d.ledger || []).length }));
  return out;
})()
