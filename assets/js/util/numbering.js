// Document numbering: per-business, per-doctype sequences with three formats.
//   plain    -> INV-001
//   year     -> INV-2026-001
//   fy-india -> INV/2026-27/001   (April–March financial year)

import { fyIndia, calYear } from './dates.js';

export const NUMBER_FORMATS = [
  { id: 'plain', label: 'Simple (INV-001)' },
  { id: 'year', label: 'Yearly (INV-2026-001)' },
  { id: 'fy-india', label: 'Financial year, India (INV/2026-27/001)' },
];

export function buildNumber(seq, dateISO) {
  const prefix = (seq.prefix ?? 'INV').replace(/[-/\s]+$/, '');
  const n = String(seq.next ?? 1).padStart(seq.pad ?? 3, '0');
  switch (seq.format) {
    case 'year':
      return `${prefix}-${calYear(dateISO)}-${n}`;
    case 'fy-india':
      return `${prefix}/${fyIndia(dateISO)}/${n}`;
    default:
      return `${prefix}-${n}`;
  }
}

export function defaultSequence(prefix = 'INV') {
  return { prefix, format: 'plain', next: 1, pad: 3 };
}
