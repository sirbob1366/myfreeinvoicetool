// Date helpers. All document dates are stored as ISO `YYYY-MM-DD` strings and
// formatted for display per the selected currency locale.

export function todayISO() {
  const d = new Date();
  return toISO(d);
}

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function addDays(iso, days) {
  const d = parseISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function formatDate(iso, locale = 'en-US') {
  const d = parseISO(iso);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  } catch {
    return iso;
  }
}

// Indian financial year (April–March): 2026-06-11 -> "2026-27"; 2026-02-01 -> "2025-26"
export function fyIndia(iso) {
  const d = parseISO(iso) || new Date();
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const end = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${end}`;
}

// Calendar-year string for "year" numbering format.
export function calYear(iso) {
  const d = parseISO(iso) || new Date();
  return String(d.getFullYear());
}

export const TERMS_PRESETS = [
  { id: 'receipt', label: 'Due on receipt', days: 0 },
  { id: 'net7', label: 'Net 7', days: 7 },
  { id: 'net15', label: 'Net 15', days: 15 },
  { id: 'net30', label: 'Net 30', days: 30 },
  { id: 'net45', label: 'Net 45', days: 45 },
  { id: 'net60', label: 'Net 60', days: 60 },
  { id: 'custom', label: 'Custom date', days: null },
];
