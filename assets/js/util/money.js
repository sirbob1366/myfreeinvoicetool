// Currency catalog + locale-aware formatting.
// `symbol` is the display symbol; `pdfSymbol` is a WinAnsi-safe fallback used
// until a Unicode font is embedded (kept identical in preview so the preview
// stays PDF-faithful). `units` = [majorSingular, majorPlural, minorSingular, minorPlural].

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',            symbol: '$',    pdfSymbol: '$',    locale: 'en-US', decimals: 2, units: ['Dollar', 'Dollars', 'Cent', 'Cents'] },
  { code: 'EUR', name: 'Euro',                 symbol: '€',    pdfSymbol: '€',    locale: 'de-DE', decimals: 2, units: ['Euro', 'Euros', 'Cent', 'Cents'] },
  { code: 'GBP', name: 'British Pound',        symbol: '£',    pdfSymbol: '£',    locale: 'en-GB', decimals: 2, units: ['Pound', 'Pounds', 'Penny', 'Pence'] },
  { code: 'INR', name: 'Indian Rupee',         symbol: '₹',    pdfSymbol: 'Rs.',  locale: 'en-IN', decimals: 2, units: ['Rupee', 'Rupees', 'Paisa', 'Paise'] },
  { code: 'CAD', name: 'Canadian Dollar',      symbol: 'CA$',  pdfSymbol: 'CA$',  locale: 'en-CA', decimals: 2, units: ['Dollar', 'Dollars', 'Cent', 'Cents'] },
  { code: 'AUD', name: 'Australian Dollar',    symbol: 'A$',   pdfSymbol: 'A$',   locale: 'en-AU', decimals: 2, units: ['Dollar', 'Dollars', 'Cent', 'Cents'] },
  { code: 'NZD', name: 'New Zealand Dollar',   symbol: 'NZ$',  pdfSymbol: 'NZ$',  locale: 'en-NZ', decimals: 2, units: ['Dollar', 'Dollars', 'Cent', 'Cents'] },
  { code: 'JPY', name: 'Japanese Yen',         symbol: '¥',    pdfSymbol: '¥',    locale: 'ja-JP', decimals: 0, units: ['Yen', 'Yen', '', ''] },
  { code: 'CNY', name: 'Chinese Yuan',         symbol: 'CN¥',  pdfSymbol: 'CN¥',  locale: 'zh-CN', decimals: 2, units: ['Yuan', 'Yuan', 'Fen', 'Fen'] },
  { code: 'CHF', name: 'Swiss Franc',          symbol: 'CHF',  pdfSymbol: 'CHF',  locale: 'de-CH', decimals: 2, units: ['Franc', 'Francs', 'Rappen', 'Rappen'] },
  { code: 'SEK', name: 'Swedish Krona',        symbol: 'kr',   pdfSymbol: 'kr',   locale: 'sv-SE', decimals: 2, units: ['Krona', 'Kronor', 'Öre', 'Öre'] },
  { code: 'NOK', name: 'Norwegian Krone',      symbol: 'kr',   pdfSymbol: 'kr',   locale: 'nb-NO', decimals: 2, units: ['Krone', 'Kroner', 'Øre', 'Øre'] },
  { code: 'DKK', name: 'Danish Krone',         symbol: 'kr',   pdfSymbol: 'kr',   locale: 'da-DK', decimals: 2, units: ['Krone', 'Kroner', 'Øre', 'Øre'] },
  { code: 'SGD', name: 'Singapore Dollar',     symbol: 'S$',   pdfSymbol: 'S$',   locale: 'en-SG', decimals: 2, units: ['Dollar', 'Dollars', 'Cent', 'Cents'] },
  { code: 'HKD', name: 'Hong Kong Dollar',     symbol: 'HK$',  pdfSymbol: 'HK$',  locale: 'en-HK', decimals: 2, units: ['Dollar', 'Dollars', 'Cent', 'Cents'] },
  { code: 'AED', name: 'UAE Dirham',           symbol: 'AED',  pdfSymbol: 'AED',  locale: 'en-AE', decimals: 2, units: ['Dirham', 'Dirhams', 'Fils', 'Fils'] },
  { code: 'SAR', name: 'Saudi Riyal',          symbol: 'SAR',  pdfSymbol: 'SAR',  locale: 'en-SA', decimals: 2, units: ['Riyal', 'Riyals', 'Halala', 'Halalas'] },
  { code: 'QAR', name: 'Qatari Riyal',         symbol: 'QAR',  pdfSymbol: 'QAR',  locale: 'en-QA', decimals: 2, units: ['Riyal', 'Riyals', 'Dirham', 'Dirhams'] },
  { code: 'KWD', name: 'Kuwaiti Dinar',        symbol: 'KD',   pdfSymbol: 'KD',   locale: 'en-KW', decimals: 3, units: ['Dinar', 'Dinars', 'Fils', 'Fils'] },
  { code: 'ZAR', name: 'South African Rand',   symbol: 'R',    pdfSymbol: 'R',    locale: 'en-ZA', decimals: 2, units: ['Rand', 'Rand', 'Cent', 'Cents'] },
  { code: 'BRL', name: 'Brazilian Real',       symbol: 'R$',   pdfSymbol: 'R$',   locale: 'pt-BR', decimals: 2, units: ['Real', 'Reais', 'Centavo', 'Centavos'] },
  { code: 'MXN', name: 'Mexican Peso',         symbol: 'MX$',  pdfSymbol: 'MX$',  locale: 'es-MX', decimals: 2, units: ['Peso', 'Pesos', 'Centavo', 'Centavos'] },
  { code: 'ARS', name: 'Argentine Peso',       symbol: 'AR$',  pdfSymbol: 'AR$',  locale: 'es-AR', decimals: 2, units: ['Peso', 'Pesos', 'Centavo', 'Centavos'] },
  { code: 'CLP', name: 'Chilean Peso',         symbol: 'CL$',  pdfSymbol: 'CL$',  locale: 'es-CL', decimals: 0, units: ['Peso', 'Pesos', '', ''] },
  { code: 'COP', name: 'Colombian Peso',       symbol: 'CO$',  pdfSymbol: 'CO$',  locale: 'es-CO', decimals: 2, units: ['Peso', 'Pesos', 'Centavo', 'Centavos'] },
  { code: 'PHP', name: 'Philippine Peso',      symbol: '₱',    pdfSymbol: 'PHP ', locale: 'en-PH', decimals: 2, units: ['Peso', 'Pesos', 'Centavo', 'Centavos'] },
  { code: 'THB', name: 'Thai Baht',            symbol: '฿',    pdfSymbol: 'THB ', locale: 'th-TH', decimals: 2, units: ['Baht', 'Baht', 'Satang', 'Satang'] },
  { code: 'VND', name: 'Vietnamese Dong',      symbol: '₫',    pdfSymbol: 'VND ', locale: 'vi-VN', decimals: 0, units: ['Dong', 'Dong', '', ''] },
  { code: 'IDR', name: 'Indonesian Rupiah',    symbol: 'Rp',   pdfSymbol: 'Rp',   locale: 'id-ID', decimals: 0, units: ['Rupiah', 'Rupiah', 'Sen', 'Sen'] },
  { code: 'MYR', name: 'Malaysian Ringgit',    symbol: 'RM',   pdfSymbol: 'RM',   locale: 'ms-MY', decimals: 2, units: ['Ringgit', 'Ringgit', 'Sen', 'Sen'] },
  { code: 'KRW', name: 'South Korean Won',     symbol: '₩',    pdfSymbol: 'KRW ', locale: 'ko-KR', decimals: 0, units: ['Won', 'Won', '', ''] },
  { code: 'TRY', name: 'Turkish Lira',         symbol: '₺',    pdfSymbol: 'TL ',  locale: 'tr-TR', decimals: 2, units: ['Lira', 'Lira', 'Kurus', 'Kurus'] },
  { code: 'RUB', name: 'Russian Ruble',        symbol: '₽',    pdfSymbol: 'RUB ', locale: 'ru-RU', decimals: 2, units: ['Ruble', 'Rubles', 'Kopek', 'Kopeks'] },
  { code: 'PLN', name: 'Polish Zloty',         symbol: 'zł',   pdfSymbol: 'zl ',  locale: 'pl-PL', decimals: 2, units: ['Zloty', 'Zlotys', 'Grosz', 'Groszy'] },
  { code: 'CZK', name: 'Czech Koruna',         symbol: 'Kč',   pdfSymbol: 'Kc ',  locale: 'cs-CZ', decimals: 2, units: ['Koruna', 'Koruny', 'Haler', 'Halere'] },
  { code: 'HUF', name: 'Hungarian Forint',     symbol: 'Ft',   pdfSymbol: 'Ft',   locale: 'hu-HU', decimals: 0, units: ['Forint', 'Forints', '', ''] },
  { code: 'ILS', name: 'Israeli New Shekel',   symbol: '₪',    pdfSymbol: 'ILS ', locale: 'he-IL', decimals: 2, units: ['Shekel', 'Shekels', 'Agora', 'Agorot'] },
  { code: 'EGP', name: 'Egyptian Pound',       symbol: 'E£',   pdfSymbol: 'E£',   locale: 'en-EG', decimals: 2, units: ['Pound', 'Pounds', 'Piastre', 'Piastres'] },
  { code: 'NGN', name: 'Nigerian Naira',       symbol: '₦',    pdfSymbol: 'NGN ', locale: 'en-NG', decimals: 2, units: ['Naira', 'Naira', 'Kobo', 'Kobo'] },
  { code: 'KES', name: 'Kenyan Shilling',      symbol: 'KSh',  pdfSymbol: 'KSh',  locale: 'en-KE', decimals: 2, units: ['Shilling', 'Shillings', 'Cent', 'Cents'] },
  { code: 'PKR', name: 'Pakistani Rupee',      symbol: 'Rs',   pdfSymbol: 'Rs',   locale: 'en-PK', decimals: 2, units: ['Rupee', 'Rupees', 'Paisa', 'Paise'] },
  { code: 'LKR', name: 'Sri Lankan Rupee',     symbol: 'Rs',   pdfSymbol: 'Rs',   locale: 'en-LK', decimals: 2, units: ['Rupee', 'Rupees', 'Cent', 'Cents'] },
  { code: 'BDT', name: 'Bangladeshi Taka',     symbol: '৳',    pdfSymbol: 'Tk ',  locale: 'en-BD', decimals: 2, units: ['Taka', 'Taka', 'Poisha', 'Poisha'] },
  { code: 'NPR', name: 'Nepalese Rupee',       symbol: 'Rs',   pdfSymbol: 'Rs',   locale: 'en-NP', decimals: 2, units: ['Rupee', 'Rupees', 'Paisa', 'Paise'] },
];

const byCode = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currency(code) {
  return byCode.get(code) || byCode.get('USD');
}

// Format a number per the currency's home locale, with an explicit symbol so
// the exact same string can be drawn into the PDF.
// opts.pdfSafe: use the WinAnsi-safe symbol (what the PDF will show).
// opts.bare: number only, no symbol.
export function formatMoney(amount, code, opts = {}) {
  const cur = currency(code);
  const n = Number.isFinite(amount) ? amount : 0;
  const num = new Intl.NumberFormat(cur.locale, {
    minimumFractionDigits: cur.decimals,
    maximumFractionDigits: cur.decimals,
  }).format(n);
  if (opts.bare) return num;
  const sym = opts.pdfSafe ? cur.pdfSymbol : cur.symbol;
  const sep = /[A-Za-z.]$/.test(sym.trimEnd()) && !sym.endsWith(' ') ? ' ' : '';
  return n < 0 ? `-${sym}${sep}${num.replace('-', '')}` : `${sym}${sep}${num}`;
}

export function roundMoney(amount, code) {
  const d = currency(code).decimals;
  const f = 10 ** d;
  return Math.round((amount + Number.EPSILON) * f) / f;
}
