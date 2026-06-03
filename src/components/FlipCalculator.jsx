import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import * as calc from '../lib/formulas'
import { fmtKinah, fmtPct } from '../lib/formatters'
import MetricCard from './ui/MetricCard'
import BreakEvenBox from './ui/BreakEvenBox'
import RiskBadge from './ui/RiskBadge'
import Slider from './ui/Slider'

export default function FlipCalculator({ game }) {
  const { t } = useTranslation()
  const [buyPrice, setBuyPrice] = useState(500)
  const [sellPrice, setSellPrice] = useState(750)
  const [qty, setQty] = useState(10)
  const [taxRate, setTaxRate] = useState(game?.defaultTaxRate ?? 20)
  const [regFee, setRegFee] = useState(game?.defaultRegFee ?? 11)

  const tax = taxRate / 100

  const results = useMemo(() => {
    const cost = calc.totalCost(buyPrice * qty, regFee * qty)
    const bep = (cost / qty) / (1 - tax)
    const profitUnit = calc.profit(sellPrice, tax, cost / qty)
    const profitTotal = profitUnit * qty
    const roiPct = calc.roi(profitTotal, cost)
    const marginPct = calc.margin(profitTotal, cost)
    const risk = calc.riskLevel(marginPct)
    const isLoss = profitTotal < 0

    return { cost, bep, profitUnit, profitTotal, roiPct, marginPct, risk, isLoss }
  }, [buyPrice, sellPrice, qty, taxRate, regFee, tax])

  const profitColor = (val) => val >= 0 ? 'text-emerald-400' : 'text-rose-400'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — Inputs */}
      <div className="card">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">{t('flip.details')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">{t('flip.buyPrice')}</label>
            <input
              type="number"
              className="input-field"
              value={buyPrice}
              min={0}
              onChange={e => setBuyPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">{t('flip.sellPrice')}</label>
            <input
              type="number"
              className="input-field"
              value={sellPrice}
              min={0}
              onChange={e => setSellPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">{t('flip.quantity')}</label>
            <input
              type="number"
              className="input-field"
              value={qty}
              min={1}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <Slider
            id="flip-tax"
            label={t('flip.taxRate')}
            value={taxRate}
            onChange={setTaxRate}
            min={0}
            max={50}
          />
          <div>
            <label className="text-xs text-slate-400 block mb-1">{t('flip.regFee')}</label>
            <input
              type="number"
              className="input-field"
              value={regFee}
              min={0}
              onChange={e => setRegFee(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* RIGHT — Results */}
      <div className="space-y-5">
        <BreakEvenBox
          isLoss={results.isLoss}
          label={results.isLoss ? t('results.atLoss') : t('results.breakEven')}
          price={fmtKinah(results.bep)}
        >
          <div className="flex items-center gap-2 justify-end">
            <RiskBadge level={results.risk} />
          </div>
        </BreakEvenBox>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label={t('results.netProfitTotal')}
            value={fmtKinah(results.profitTotal)}
            colorClass={profitColor(results.profitTotal)}
          />
          <MetricCard
            label={t('results.profitUnit')}
            value={fmtKinah(results.profitUnit)}
            colorClass={profitColor(results.profitUnit)}
          />
          <MetricCard
            label={t('results.roi')}
            value={fmtPct(results.roiPct)}
            colorClass={profitColor(results.roiPct)}
          />
          <MetricCard
            label={t('results.margin')}
            value={fmtPct(results.marginPct)}
            colorClass={profitColor(results.marginPct)}
          />
        </div>
      </div>
    </div>
  )
}
