// Display status for a workspace document record. Overdue is computed, never
// stored — a doc with balance outstanding past its due date flags itself.

import { todayISO } from './util/dates.js';

export const STATUSES = ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue'];

export function displayStatus(rec) {
  const total = +rec.total || 0;
  const balance = rec.balance == null ? total : +rec.balance;
  if (total > 0 && balance <= 0) return 'Paid';
  const overdue = !!rec.dueDate && rec.dueDate < todayISO() && balance > 0 && rec.status !== 'Draft';
  if (overdue) return 'Overdue';
  if (balance > 0 && balance < total) return 'Partial';
  return rec.status === 'Draft' ? 'Draft' : (rec.status || 'Sent');
}
