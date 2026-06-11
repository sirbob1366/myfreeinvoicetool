// IndexedDB storage layer. Everything the user creates lives here, in their
// browser — no server, no account. Object stores:
//   settings   {key, value}
//   businesses {id, name, logo, address, email, phone, taxLabel, taxValue, numbering, defaults}
//   clients    {id, name, address, email, phone, gstin, state}
//   items      {id, description, rate, taxPct, hsn}
//   snippets   {id, kind: 'notes'|'terms', title, text}
//   documents  {id, docType, businessId, number, status, issueDate, dueDate,
//               clientName, currency, total, balance, ledger: [{date, amount, note}], state}

const DB_NAME = 'mfit-db';
const DB_VERSION = 1;
export const STORES = ['settings', 'businesses', 'clients', 'items', 'snippets', 'documents'];

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      for (const name of ['businesses', 'clients', 'items', 'snippets', 'documents']) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result.result !== undefined ? result.result : result);
    t.onerror = () => reject(t.error);
  });
}

export function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function put(store, obj) {
  const db = await openDB();
  await tx(db, store, 'readwrite', (s) => s.put(obj));
  return obj;
}

export async function get(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function del(store, key) {
  const db = await openDB();
  return tx(db, store, 'readwrite', (s) => s.delete(key));
}

export async function all(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getSetting(key, fallback = null) {
  const row = await get('settings', key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  return put('settings', { key, value });
}

// --- Backup: one JSON file holding everything ---

export async function exportBackup() {
  const data = { app: 'myfreeinvoicetool', version: DB_VERSION, exportedAt: new Date().toISOString() };
  for (const store of STORES) data[store] = await all(store);
  return JSON.stringify(data, null, 2);
}

export async function importBackup(json, { merge = false } = {}) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (data.app !== 'myfreeinvoicetool') throw new Error('Not a MyFreeInvoiceTool backup file.');
  const db = await openDB();
  for (const store of STORES) {
    const rows = data[store];
    if (!Array.isArray(rows)) continue;
    await new Promise((resolve, reject) => {
      const t = db.transaction(store, 'readwrite');
      const s = t.objectStore(store);
      if (!merge) s.clear();
      for (const row of rows) s.put(row);
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  }
}

export function downloadBlob(content, filename, type = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
