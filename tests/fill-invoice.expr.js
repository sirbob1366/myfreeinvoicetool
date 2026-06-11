(async () => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('[data-bind="business.name"]', 'Acme Studio');
  set('[data-bind="business.address"]', '12 Baker Street\nLondon NW1 6XE');
  set('[data-bind="business.email"]', 'billing@acme.studio');
  set('[data-bind="client.name"]', 'Globex Corporation');
  set('[data-bind="client.address"]', '742 Evergreen Terrace\nSpringfield');
  set('.i-desc', 'Website redesign — discovery, wireframes and final UI delivered across desktop and mobile breakpoints');
  set('.i-qty', '12');
  set('.i-rate', '150');
  set('[data-bind="taxMode"]', 'single');
  set('[data-bind="taxPct"]', '20');
  set('[data-bind="discount.value"]', '10');
  set('[data-bind="wordsMode"]', 'western');
  set('[data-bind="notes"]', 'Thank you for your business.');
  set('[data-bind="payment.bank"]', 'Acme Studio Ltd · IBAN GB00 ACME 0000 1234');
  await new Promise((r) => setTimeout(r, 700));
  const texts = [...document.querySelectorAll('.pv-text')].map((e) => e.textContent);
  return {
    pages: document.querySelectorAll('.pv-page').length,
    hasClient: texts.some((t) => t.includes('Globex')),
    taxRow: texts.find((t) => t.includes('(20%)')),
    moneyTail: texts.filter((t) => t.includes('$')).slice(-7),
    words: texts.find((t) => t.includes('Dollars')),
    overflowX: document.querySelector('#preview').scrollWidth - document.querySelector('#preview').clientWidth,
  };
})()
