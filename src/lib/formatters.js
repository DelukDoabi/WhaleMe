/**
 * Format a number as game currency
 * @param {number} n
 * @param {string} [currency='₭'] - currency symbol
 * @returns {string}
 */
export const fmtKinah = (n, currency = '₭') => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Math.round(n).toLocaleString() + ' ' + currency;
};

/**
 * Format a number as percentage
 * @param {number} n
 * @returns {string}
 */
export const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toFixed(1) + '%';
};
