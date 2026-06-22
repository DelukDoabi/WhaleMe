import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'whaleme_material_history'
const MAX_ENTRIES = 60

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function persist(h) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)) } catch {}
}

function normalize(name) {
  return (name || '').trim().toLowerCase()
}

const Context = createContext(null)

export function MaterialHistoryProvider({ children }) {
  const [history, setHistory] = useState(load)

  /**
   * Record prices from a materials array: [{ name, unitCost }]
   */
  const recordPrices = useCallback((materials) => {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    setHistory(prev => {
      const next = { ...prev }
      for (const mat of materials) {
        const name = mat.name?.trim()
        const price = Number(mat.unitCost)
        if (!name || !price) continue
        const key = normalize(name)
        const existing = next[key] ?? { displayName: name, entries: [] }
        const todayIdx = existing.entries.findIndex(e => e.date === date)
        const entries = todayIdx >= 0
          ? existing.entries.map((e, i) => i === todayIdx ? { ...e, unitCost: price } : e)
          : [...existing.entries, { date, unitCost: price }].slice(-MAX_ENTRIES)
        next[key] = { displayName: name, entries }
      }
      persist(next)
      return next
    })
  }, [])

  /**
   * Returns up to 8 matching suggestions for a query string.
   */
  const getSuggestions = useCallback((query) => {
    if (!query) return []
    const q = normalize(query)
    return Object.entries(history)
      .filter(([key]) => key.startsWith(q) || key.includes(q))
      .sort(([a], [b]) => (a.startsWith(q) ? 0 : 1) - (b.startsWith(q) ? 0 : 1))
      .slice(0, 8)
      .map(([, val]) => ({
        displayName: val.displayName,
        lastPrice: val.entries.at(-1)?.unitCost ?? 0,
        entries: val.entries,
      }))
  }, [history])

  /**
   * Returns history object for a given material name, or null.
   */
  const getHistory = useCallback((name) => {
    return history[normalize(name)] ?? null
  }, [history])

  return (
    <Context.Provider value={{ recordPrices, getSuggestions, getHistory }}>
      {children}
    </Context.Provider>
  )
}

export const useMaterialHistory = () => useContext(Context)
