import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as calc from '../lib/formulas'
import { fmtKinah, fmtPct } from '../lib/formatters'
import MetricCard from './ui/MetricCard'
import BreakEvenBox from './ui/BreakEvenBox'
import Slider from './ui/Slider'
import useSavedCrafts from '../hooks/useSavedCrafts'

const defaultMaterials = [
  { id: 1, name: '', unitCost: 0, quantity: 1 },
]

export default function CraftCalculator({ game }) {
  const { gameCrafts, saveCraft, deleteCraft } = useSavedCrafts(game?.id ?? 'aion2')

  const [currentCraftId, setCurrentCraftId] = useState(null)
  const [itemName, setItemName] = useState('')
  const [qty, setQty] = useState(1)
  const [materials, setMaterials] = useState(defaultMaterials)
  const [taxRate, setTaxRate] = useState(game?.defaultTaxRate ?? 20)
  const [regFee, setRegFee] = useState(game?.defaultRegFee ?? 11)
  const [salePrice, setSalePrice] = useState(0)
  const [nextId, setNextId] = useState(2)
  const [showSaveToast, setShowSaveToast] = useState(false)

  const tax = taxRate / 100

  const results = useMemo(() => {
    const matCost = calc.materialCost(materials)
    const totalFee = regFee * qty
    const cost = calc.totalCost(matCost, totalFee)
    const costUnit = cost / qty
    const bep = calc.breakEvenPrice(costUnit, tax)
    const netRev = calc.netRevenue(salePrice, tax)
    const profitUnit = netRev - costUnit
    const profitTotal = profitUnit * qty
    const marginPct = calc.margin(profitTotal, cost)
    const roiPct = calc.roi(profitTotal, cost)
    const isLoss = salePrice > 0 && profitTotal < 0

    const suggestions = [5, 10, 20, 30].map(m => {
      const sp = calc.suggestedPrice(costUnit, tax, m)
      const np = calc.profit(sp, tax, costUnit)
      return { targetMargin: m, price: sp, netProfit: np }
    })

    const basePrice = Math.ceil(bep)
    const simPrices = [0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0].map(mult => Math.round(basePrice * mult))
    const simulation = simPrices.map(p => {
      const pu = calc.profit(p, tax, costUnit)
      const mg = calc.margin(pu, costUnit)
      return { price: p, profit: pu, margin: mg, isBreakEven: p === basePrice }
    })

    return { matCost, totalFee, cost, costUnit, bep, profitUnit, profitTotal, marginPct, roiPct, isLoss, suggestions, simulation }
  }, [materials, qty, taxRate, regFee, salePrice, tax])

  const addMaterial = () => {
    setMaterials([...materials, { id: nextId, name: '', unitCost: 0, quantity: 1 }])
    setNextId(nextId + 1)
  }

  const removeMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id))
  }

  const updateMaterial = (id, field, value) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const profitColor = (val) => val >= 0 ? 'text-emerald-400' : 'text-rose-400'

  const hasInput = results.matCost > 0 || salePrice > 0

  const handleSave = () => {
    const name = itemName.trim() || 'Unnamed craft'
    const craft = {
      id: currentCraftId,
      name,
      gameId: game?.id ?? 'aion2',
      qty,
      materials,
      taxRate,
      regFee,
      salePrice,
    }
    const saved = saveCraft(craft)
    setCurrentCraftId(saved.id)
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2000)
  }

  const handleLoad = (craft) => {
    setCurrentCraftId(craft.id)
    setItemName(craft.name)
    setQty(craft.qty)
    setMaterials(craft.materials)
    setTaxRate(craft.taxRate)
    setRegFee(craft.regFee)
    setSalePrice(craft.salePrice)
    setNextId(Math.max(...craft.materials.map(m => m.id)) + 1)
  }

  const handleNew = () => {
    setCurrentCraftId(null)
    setItemName('')
    setQty(1)
    setMaterials(defaultMaterials)
    setTaxRate(game?.defaultTaxRate ?? 20)
    setRegFee(game?.defaultRegFee ?? 11)
    setSalePrice(0)
    setNextId(2)
  }

  const handleDelete = (id) => {
    deleteCraft(id)
    if (currentCraftId === id) handleNew()
  }

  return (
    <div className="space-y-5">
      {/* Saved Crafts Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">Saved recipes</h3>
          <div className="flex gap-2">
            <button onClick={handleNew} className="btn btn-ghost text-xs">+ New</button>
            <button onClick={handleSave} className="btn btn-primary text-xs relative">
              💾 Save
              <AnimatePresence>
                {showSaveToast && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: -24 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400 whitespace-nowrap"
                  >
                    ✓ Saved!
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {gameCrafts.length === 0 ? (
          <p className="text-xs text-slate-600 italic">No saved recipes yet. Fill the form and click Save.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gameCrafts.map(craft => (
              <div
                key={craft.id}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all border
                  ${craft.id === currentCraftId
                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
              >
                <span onClick={() => handleLoad(craft)} className="truncate max-w-[120px]">
                  {craft.name}
                </span>
                <span className="text-[9px] text-slate-600 hidden sm:inline">
                  {new Date(craft.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(craft.id) }}
                  className="ml-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — Inputs */}
      <div className="space-y-5">
        <div className="card">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">Item info</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Item name (optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Orichalcum Ingot"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Quantity produced</label>
              <input
                type="number"
                className="input-field"
                value={qty}
                min={1}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">Materials</h3>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 text-[10px] uppercase text-slate-500 tracking-wide px-1">
              <span>Material</span>
              <span>Unit cost</span>
              <span>Qty</span>
              <span></span>
            </div>
            {/* Rows */}
            <AnimatePresence>
              {materials.map(mat => (
                <motion.div
                  key={mat.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center"
                >
                  <input
                    type="text"
                    className="input-field text-xs"
                    placeholder="Material"
                    value={mat.name}
                    onChange={e => updateMaterial(mat.id, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input-field text-xs"
                    value={mat.unitCost}
                    min={0}
                    onChange={e => updateMaterial(mat.id, 'unitCost', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="input-field text-xs"
                    value={mat.quantity}
                    min={1}
                    onChange={e => updateMaterial(mat.id, 'quantity', Math.max(1, Number(e.target.value)))}
                  />
                  <button
                    onClick={() => removeMaterial(mat.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <button onClick={addMaterial} className="btn btn-ghost text-xs mt-3">
            + Add material
          </button>
        </div>

        <div className="card">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">Market settings</h3>
          <div className="space-y-4">
            <Slider
              id="tax-rate"
              label="Tax rate"
              value={taxRate}
              onChange={setTaxRate}
              min={0}
              max={50}
            />
            <div>
              <label className="text-xs text-slate-400 block mb-1">Registration fee (per listing)</label>
              <input
                type="number"
                className="input-field"
                value={regFee}
                min={0}
                onChange={e => setRegFee(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Estimated sale price</label>
              <input
                type="number"
                className="input-field"
                value={salePrice}
                min={0}
                onChange={e => setSalePrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Results */}
      <div className="space-y-5">
        {!hasInput ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <span className="text-3xl mb-3">⚒️</span>
            <p className="text-sm text-slate-400">Add your materials and sale price to see results</p>
            <p className="text-xs text-slate-600 mt-1">Break-even, profit, margin and simulations will appear here</p>
          </div>
        ) : (
        <>
        <BreakEvenBox
          isLoss={results.isLoss}
          label={results.isLoss ? 'Currently at a loss' : 'Break-even price'}
          price={fmtKinah(results.bep)}
        >
          <div>Mat cost: <strong className="text-slate-200">{fmtKinah(results.matCost)}</strong></div>
          <div>Fee: <strong className="text-slate-200">{fmtKinah(results.totalFee)}</strong></div>
          <div>Cost/unit: <strong className="text-slate-200">{fmtKinah(results.costUnit)}</strong></div>
        </BreakEvenBox>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Net profit (total)"
            value={salePrice > 0 ? fmtKinah(results.profitTotal) : '—'}
            colorClass={salePrice > 0 ? profitColor(results.profitTotal) : ''}
          />
          <MetricCard
            label="Net profit (per unit)"
            value={salePrice > 0 ? fmtKinah(results.profitUnit) : '—'}
            colorClass={salePrice > 0 ? profitColor(results.profitUnit) : ''}
          />
          <MetricCard
            label="Margin"
            value={salePrice > 0 ? fmtPct(results.marginPct) : '—'}
            colorClass={salePrice > 0 ? profitColor(results.marginPct) : ''}
          />
          <MetricCard
            label="ROI"
            value={salePrice > 0 ? fmtPct(results.roiPct) : '—'}
            colorClass={salePrice > 0 ? profitColor(results.roiPct) : ''}
          />
        </div>

        <div className="card">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Pricing suggestions</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                <th className="text-left py-2 font-medium">Target margin</th>
                <th className="text-left py-2 font-medium">Suggested price</th>
                <th className="text-left py-2 font-medium">Net profit</th>
              </tr>
            </thead>
            <tbody>
              {results.suggestions.map((s, i) => (
                <motion.tr
                  key={s.targetMargin}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-700/30 last:border-none"
                >
                  <td className="py-2 text-slate-300">+{s.targetMargin}%</td>
                  <td className="py-2 text-slate-200">{fmtKinah(s.price)}</td>
                  <td className="py-2 text-emerald-400">{fmtKinah(s.netProfit)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Price simulation</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                <th className="text-left py-2 font-medium">Sale price</th>
                <th className="text-left py-2 font-medium">Net profit</th>
                <th className="text-left py-2 font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {results.simulation.map((s, i) => {
                const cls = s.profit < 0 ? 'text-rose-400' : s.isBreakEven ? 'text-amber-400' : 'text-emerald-400'
                return (
                  <motion.tr
                    key={s.price}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-700/30 last:border-none"
                  >
                    <td className="py-2 text-slate-300">
                      {fmtKinah(s.price)}
                      {s.isBreakEven && <span className="ml-1.5 text-[10px] text-slate-500">(break-even)</span>}
                    </td>
                    <td className={`py-2 font-medium ${cls}`}>{fmtKinah(s.profit)}</td>
                    <td className={`py-2 ${cls}`}>{fmtPct(s.margin)}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>
    </div>
    </div>
  )
}
