import { useState, useRef, useEffect } from 'react'
import { useMaterialHistory } from '../../contexts/MaterialHistoryContext'

// Simple SVG sparkline showing price over time
function Sparkline({ entries, width = 170, height = 40 }) {
  if (!entries || entries.length < 2) return null
  const prices = entries.map(e => e.unitCost)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const n = entries.length
  const PAD = 4

  const pts = entries.map((e, i) => {
    const x = PAD + (i / (n - 1)) * (width - PAD * 2)
    const y = PAD + ((max - e.unitCost) / range) * (height - PAD * 2)
    return [x, y]
  })

  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const [lx, ly] = pts.at(-1)
  const [fx, fy] = pts[0]

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={polyline}
        fill="none"
        stroke="rgb(139 92 246)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={fx} cy={fy} r="2" fill="rgb(139 92 246)" opacity="0.4" />
      <circle cx={lx} cy={ly} r="3" fill="rgb(139 92 246)" />
    </svg>
  )
}

function fmtShort(v) {
  if (!v) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}

/**
 * Material name input with:
 * - Autocomplete dropdown from price history
 * - 📈 hover button showing sparkline + price history
 *
 * Props:
 *   value: string
 *   onChange: (string) => void
 *   onPriceSelect: (number) => void   — called when suggestion selected, with its last price
 *   placeholder: string
 *   className: string
 */
export default function MaterialInput({ value, onChange, onPriceSelect, placeholder, className = '' }) {
  const { getSuggestions, getHistory } = useMaterialHistory()
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const wrapRef = useRef(null)

  const suggestions = value.length >= 1 ? getSuggestions(value) : []
  const matHistory = getHistory(value)
  const hasHistory = matHistory && matHistory.entries.length > 0

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className={`relative flex items-center gap-1 ${className}`}>
      {/* Name input */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          className="input-field text-xs w-full"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => value && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />

        {/* Autocomplete dropdown */}
        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 z-40 mt-1 w-64 rounded-lg border border-slate-700/60 bg-navy-950 shadow-2xl overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-slate-700/50 transition-colors border-b border-slate-800/50 last:border-0"
                onMouseDown={e => {
                  e.preventDefault()
                  onChange(s.displayName)
                  onPriceSelect?.(s.lastPrice)
                  setOpen(false)
                }}
              >
                <span className="text-slate-200 truncate">{s.displayName}</span>
                <span className="text-slate-500 ml-2 shrink-0">{fmtShort(s.lastPrice)} Ꝃ</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* History badge */}
      {hasHistory && (
        <div
          className="relative shrink-0"
          onMouseEnter={() => setHistoryOpen(true)}
          onMouseLeave={() => setHistoryOpen(false)}
        >
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center rounded text-[11px] text-violet-400/50 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            📈
          </button>

          {/* History popup */}
          {historyOpen && (
            <div className="absolute bottom-full right-0 mb-2 z-50 w-60 rounded-lg border border-slate-700/60 bg-navy-950 shadow-2xl p-3 pointer-events-none">
              <div className="text-[10px] text-violet-400 font-medium uppercase tracking-wide mb-2 truncate">
                {value}
              </div>

              <Sparkline entries={matHistory.entries} />

              {/* Min / max legend */}
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5 mb-2">
                <span>{matHistory.entries[0]?.date}</span>
                <span>{matHistory.entries.at(-1)?.date}</span>
              </div>

              {/* Price list */}
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {[...matHistory.entries].reverse().slice(0, 10).map((e, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="text-slate-500">{e.date}</span>
                    <span className="text-slate-300">{e.unitCost.toLocaleString()} Ꝃ</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
