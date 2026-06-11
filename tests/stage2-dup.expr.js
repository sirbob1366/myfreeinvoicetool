(() => {
  // Click duplicate and return immediately; the next script step inspects the result.
  const btn = document.querySelector('#docs-body tr[data-id] [data-act="dup"]');
  if (btn) btn.click();
  return { clicked: !!btn };
})()
