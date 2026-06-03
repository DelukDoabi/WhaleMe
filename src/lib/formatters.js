/**
 * Format a number as Kinah currency
 * @param {number} n
 * @returns {string}
 */
export const fmtKinah = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Math.round(n).toLocaleString() + ' ₭';
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
