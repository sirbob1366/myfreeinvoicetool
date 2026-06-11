(async () => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('[data-bind="business.name"]', 'Acme Studio');
  set('[data-bind="client.name"]', 'Globex Corporation');
  set('.i-desc', 'Consulting');
  set('.i-qty', '3');
  set('.i-rate', '500');
  const results = {};
  const ids = ['classic-serif', 'modern-grid', 'minimal-mono', 'bold-header', 'elegant-ledger', 'compact', 'gst-standard', 'creative', 'letterhead', 'statement'];
  for (const id of ids) {
    set('[data-bind="template"]', id);
    await new Promise((r) => setTimeout(r, 250));
    const page = document.querySelector('.pv-page');
    results[id] = page ? page.children.length : 'FAIL';
  }
  set('[data-bind="pageSize"]', 'letter');
  await new Promise((r) => setTimeout(r, 250));
  results.letterWidth = document.querySelector('.pv-page').style.width;
  return results;
})()
