/**
 * Net revenue after market tax
 * @param {number} salePrice
 * @param {number} taxRate - decimal (0.2 = 20%)
 */
export const netRevenue = (salePrice, taxRate) =>
  salePrice * (1 - taxRate);

/**
 * Total cost = materials + registration fees
 * @param {number} materialCost
 * @param {number} registrationFee
 */
export const totalCost = (materialCost, registrationFee) =>
  materialCost + registrationFee;

/**
 * Minimum sale price to not lose money (break-even)
 * @param {number} cost - total cost
 * @param {number} taxRate - decimal
 */
export const breakEvenPrice = (cost, taxRate) =>
  cost / (1 - taxRate);

/**
 * Net profit after tax and costs
 * @param {number} salePrice
 * @param {number} taxRate - decimal
 * @param {number} cost - total cost
 */
export const profit = (salePrice, taxRate, cost) =>
  netRevenue(salePrice, taxRate) - cost;

/**
 * Margin % = profit / cost * 100
 * @param {number} profitValue
 * @param {number} cost
 */
export const margin = (profitValue, cost) =>
  cost > 0 ? (profitValue / cost) * 100 : 0;

/**
 * ROI % (same formula as margin in this context)
 * @param {number} profitValue
 * @param {number} cost
 */
export const roi = (profitValue, cost) =>
  margin(profitValue, cost);

/**
 * Suggested sale price for a target margin %
 * @param {number} costUnit - cost per unit
 * @param {number} taxRate - decimal
 * @param {number} targetMarginPct - e.g. 10 for 10%
 */
export const suggestedPrice = (costUnit, taxRate, targetMarginPct) =>
  costUnit * (1 + targetMarginPct / 100) / (1 - taxRate);

/**
 * Risk level based on margin
 * @param {number} marginPct
 * @returns {'low' | 'medium' | 'high'}
 */
export const riskLevel = (marginPct) => {
  if (marginPct < 5) return 'high';
  if (marginPct < 15) return 'medium';
  return 'low';
};

/**
 * Calculate material cost from recipe
 * @param {Array<{unitCost: number, quantity: number}>} materials
 */
export const materialCost = (materials) =>
  materials.reduce((sum, m) => sum + (m.unitCost || 0) * (m.quantity || 0), 0);
