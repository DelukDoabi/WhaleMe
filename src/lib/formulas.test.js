import { describe, it, expect } from 'vitest'
import {
  netRevenue,
  totalCost,
  breakEvenPrice,
  profit,
  margin,
  roi,
  suggestedPrice,
  riskLevel,
  materialCost,
} from './formulas'

describe('netRevenue', () => {
  it('calculates revenue after 20% tax', () => {
    expect(netRevenue(1000, 0.2)).toBe(800)
  })

  it('returns full price with 0% tax', () => {
    expect(netRevenue(500, 0)).toBe(500)
  })
})

describe('totalCost', () => {
  it('sums material cost and registration fee', () => {
    expect(totalCost(598, 11)).toBe(609)
  })
})

describe('breakEvenPrice', () => {
  it('calculates minimum sale price to cover costs with tax', () => {
    // cost=609, tax=20% → 609 / 0.8 = 761.25
    expect(breakEvenPrice(609, 0.2)).toBeCloseTo(761.25)
  })

  it('equals cost when tax is 0', () => {
    expect(breakEvenPrice(500, 0)).toBe(500)
  })
})

describe('profit', () => {
  it('calculates net profit after tax', () => {
    // sale=800, tax=20%, cost=609 → 800*0.8 - 609 = 640 - 609 = 31
    expect(profit(800, 0.2, 609)).toBeCloseTo(31)
  })

  it('returns negative for unprofitable sale', () => {
    expect(profit(500, 0.2, 609)).toBeLessThan(0)
  })
})

describe('margin', () => {
  it('returns percentage margin', () => {
    // profit=31, cost=609 → 31/609*100 ≈ 5.09%
    expect(margin(31, 609)).toBeCloseTo(5.09, 1)
  })

  it('returns 0 when cost is 0', () => {
    expect(margin(100, 0)).toBe(0)
  })
})

describe('roi', () => {
  it('is identical to margin', () => {
    expect(roi(31, 609)).toBeCloseTo(margin(31, 609))
  })
})

describe('suggestedPrice', () => {
  it('suggests price for target margin', () => {
    // costUnit=609, tax=20%, target=10%
    // 609 * 1.10 / 0.8 = 669.9 / 0.8 = 837.375
    expect(suggestedPrice(609, 0.2, 10)).toBeCloseTo(837.375)
  })
})

describe('riskLevel', () => {
  it('returns high for margin < 5', () => {
    expect(riskLevel(3)).toBe('high')
  })

  it('returns medium for margin 5-15', () => {
    expect(riskLevel(10)).toBe('medium')
  })

  it('returns low for margin >= 15', () => {
    expect(riskLevel(20)).toBe('low')
  })
})

describe('materialCost', () => {
  it('sums up all materials', () => {
    const mats = [
      { unitCost: 99, quantity: 2 },
      { unitCost: 400, quantity: 1 },
    ]
    expect(materialCost(mats)).toBe(598)
  })

  it('handles empty array', () => {
    expect(materialCost([])).toBe(0)
  })
})
