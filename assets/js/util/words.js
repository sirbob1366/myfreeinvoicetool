// Amount-in-words in two numbering systems: Western (thousand/million/billion)
// and Indian (thousand/lakh/crore).

import { currency } from './money.js';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below100(n) {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = n % 10;
  return o ? `${t}-${ONES[o]}` : t;
}

function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = h ? `${ONES[h]} Hundred` : '';
  if (r) out += (out ? ' ' : '') + below100(r);
  return out;
}

export function westernWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Zero';
  const scales = [
    [1e12, 'Trillion'],
    [1e9, 'Billion'],
    [1e6, 'Million'],
    [1e3, 'Thousand'],
  ];
  let out = '';
  for (const [div, name] of scales) {
    const q = Math.floor(n / div);
    if (q) {
      out += (out ? ' ' : '') + `${below1000(q)} ${name}`;
      n -= q * div;
    }
  }
  if (n) out += (out ? ' ' : '') + below1000(n);
  return out;
}

export function indianWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Zero';
  const scales = [
    [1e7, 'Crore'],
    [1e5, 'Lakh'],
    [1e3, 'Thousand'],
  ];
  let out = '';
  // Crores can themselves exceed 99 (e.g. 123 crore) — words them recursively.
  const crores = Math.floor(n / 1e7);
  if (crores) {
    out = `${crores > 99 ? indianWords(crores) : below100(crores)} Crore`;
    n -= crores * 1e7;
  }
  for (const [div, name] of scales.slice(1)) {
    const q = Math.floor(n / div);
    if (q) {
      out += (out ? ' ' : '') + `${below100(q)} ${name}`;
      n -= q * div;
    }
  }
  if (n) out += (out ? ' ' : '') + below1000(n);
  return out;
}

// amountInWords(1234.56, 'INR', 'indian')
//   -> "One Thousand Two Hundred Thirty-Four Rupees and Fifty-Six Paise Only"
export function amountInWords(amount, code, system = 'western') {
  const cur = currency(code);
  const toWords = system === 'indian' ? indianWords : westernWords;
  const neg = amount < 0;
  const abs = Math.abs(amount);
  const major = Math.floor(abs + 1e-9);
  const minor = Math.round((abs - major) * 10 ** cur.decimals);
  const [maj1, majN, min1, minN] = cur.units;

  let out = toWords(major);
  out += ' ' + (major === 1 ? maj1 || cur.code : majN || cur.code);
  if (minor > 0 && cur.decimals > 0) {
    out += ` and ${toWords(minor)} ${minor === 1 ? min1 : minN}`.trimEnd();
  }
  out += ' Only';
  return (neg ? 'Minus ' : '') + out;
}
