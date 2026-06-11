// PWA bootstrap: service worker registration + install prompt + lazy extras.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Support widget loads only after the page is interactive and idle.
window.addEventListener('load', () => {
  const load = () => import('/assets/js/support.js').catch(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 });
  else setTimeout(load, 1500);
});

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const nav = document.querySelector('.site-nav');
  if (!nav || document.getElementById('pwa-install')) return;
  const btn = document.createElement('button');
  btn.id = 'pwa-install';
  btn.type = 'button';
  btn.textContent = 'Install app';
  btn.style.cssText = 'border:1px solid var(--emerald);color:var(--emerald);background:none;border-radius:999px;padding:7px 14px;font:600 13px var(--sans);cursor:pointer';
  btn.addEventListener('click', async () => {
    btn.remove();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
  nav.appendChild(btn);
});
