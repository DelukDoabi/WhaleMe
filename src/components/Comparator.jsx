import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as calc from '../lib/formulas'
import { fmtKinah, fmtPct } from '../lib/formatters'

const defaultItems = [
  { id: 1, name: 'Iron Ingot', matCost: 200, fee: 11, sellPrice: 350, tax: 20 },
  { id: 2, name: 'Health Potion', matCost: 150, fee: 11, sellPrice: 300, tax: 20 },
  { id: 3, name: 'Orichalcum Ore', matCost: 500, fee: 11, sellPrice: 900, tax: 20 },
]

export default function Comparator() {
  const [items, setItems] = useState(defaultItems)
  const [nextId, setNextId] = useState(4)

  const computed = useMemo(() => {
    return items.map(item => {
      const taxDecimal = item.tax / 100
      const cost = calc.totalCost(item.matCost, item.fee)
      const profitUnit = calc.profit(item.sellPrice, taxDecimal, cost)
      const roiPct = calc.roi(profitUnit, cost)
      const marginPct = calc.margin(profitUnit, cost)
      return { ...item, profitUnit, roiPct, marginPct }
    })
  }, [items])

  const bestIdx = useMemo(() => {
    if (computed.length === 0) return -1
    let best = 0
    for (let i = 1; i < computed.length; i++) {
      if (computed[i].roiPct > computed[best].roiPct) best = i
    }
    return best
  }, [computed])

  const addItem = () => {
    setItems([...items, { id: nextId, name: 'New Item', matCost: 100, fee: 11, sellPrice: 200, tax: 20 }])
    setNextId(nextId + 1)
  }

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const profitColor = (val) => val >= 0 ? 'text-emerald-400' : 'text-rose-400'

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">Items to compare</h3>
          <button onClick={addItem} className="btn btn-ghost text-xs">
            + Add item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                <th className="text-left py-2 font-medium">Item name</th>
                <th className="text-left py-2 font-medium">Mat cost</th>
                <th className="text-left py-2 font-medium">Fee</th>
                <th className="text-left py-2 font-medium">Sale price</th>
                <th className="text-left py-2 font-medium">Tax %</th>
                <th className="text-left py-2 font-medium">Profit/unit</th>
                <th className="text-left py-2 font-medium">ROI %</th>
                <th className="text-left py-2 font-medium">Margin %</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {computed.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`border-b border-slate-700/30 last:border-none ${i === bestIdx ? 'bg-emerald-500/5' : ''}`}
                  >
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        className="input-field text-xs"
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="input-field text-xs w-20"
                        value={item.matCost}
                        onChange={e => updateItem(item.id, 'matCost', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="input-field text-xs w-16"
                        value={item.fee}
                        onChange={e => updateItem(item.id, 'fee', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="input-field text-xs w-20"
                        value={item.sellPrice}
                        onChange={e => updateItem(item.id, 'sellPrice', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="input-field text-xs w-14"
                          value={item.tax}
                          onChange={e => updateItem(item.id, 'tax', Number(e.target.value))}
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    </td>
                    <td className={`py-2 pr-2 font-medium ${profitColor(item.profitUnit)}`}>
                      {fmtKinah(item.profitUnit)}
                    </td>
                    <td className={`py-2 pr-2 ${profitColor(item.roiPct)}`}>
                      {fmtPct(item.roiPct)}
                    </td>
                    <td className={`py-2 pr-2 ${profitColor(item.marginPct)}`}>
                      {fmtPct(item.marginPct)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Best opportunity highlight */}
      {computed.length > 0 && bestIdx >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-5 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            computed[bestIdx].roiPct >= 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}
        >
          <div>
            <div className={`text-xs font-medium uppercase tracking-wide ${computed[bestIdx].roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {computed[bestIdx].roiPct >= 0 ? `Best ROI: ${computed[bestIdx].name}` : 'No profitable items'}
            </div>
            <div className={`text-xl font-bold mt-1 ${computed[bestIdx].roiPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {fmtPct(computed[bestIdx].roiPct)} ROI · {fmtKinah(computed[bestIdx].profitUnit)}/unit
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
