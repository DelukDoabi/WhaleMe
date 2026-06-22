import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

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

/**
 * Merge two history maps. For the same material key, merge their entries
 * arrays by date (cloud wins on same-date conflicts), then sort + cap.
 */
function mergeHistories(local, cloud) {
  const result = { ...local }
  for (const [key, cloudVal] of Object.entries(cloud)) {
    const localVal = result[key]
    if (!localVal) {
      result[key] = cloudVal
    } else {
      const byDate = new Map()
      for (const e of localVal.entries) byDate.set(e.date, e)
      for (const e of cloudVal.entries) byDate.set(e.date, e) // cloud wins
      const entries = [...byDate.values()]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-MAX_ENTRIES)
      result[key] = { displayName: cloudVal.displayName, entries }
    }
  }
  return result
}

const Context = createContext(null)

export function MaterialHistoryProvider({ children }) {
  const { user } = useAuth()
  const [history, setHistory] = useState(load)

  // ── Sync from Supabase on login ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false

    async function fetchCloud() {
      const { data, error } = await supabase
        .from('material_prices')
        .select('material_key, data')
        .eq('user_id', user.id)

      if (error || !data || cancelled) return

      const cloudHistory = Object.fromEntries(data.map(r => [r.material_key, r.data]))

      setHistory(prev => {
        const merged = mergeHistories(prev, cloudHistory)
        persist(merged)

        // Upload local-only keys that the cloud doesn't have yet
        const cloudKeys = new Set(data.map(r => r.material_key))
        const localOnly = Object.entries(prev).filter(([key]) => !cloudKeys.has(key))
        if (localOnly.length > 0) {
          const rows = localOnly.map(([key, val]) => ({
            user_id: user.id,
            material_key: key,
            data: val,
            updated_at: new Date().toISOString(),
          }))
          supabase.from('material_prices')
            .upsert(rows, { onConflict: 'user_id,material_key' })
            .then(({ error: e }) => e && console.error('[MaterialHistory] upload local error', e))
        }

        return merged
      })
    }

    fetchCloud()
    return () => { cancelled = true }
  }, [user])

  // ── Record prices (called on craft save) ─────────────────────────────────
  /**
   * Record prices from a materials array: [{ name, unitCost }]
   * Updates localStorage immediately, then syncs changed keys to Supabase.
   */
  const recordPrices = useCallback((materials) => {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    setHistory(prev => {
      const next = { ...prev }
      const changed = []

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
        changed.push(key)
      }

      persist(next)

      // Fire-and-forget cloud sync
      if (user && supabase && changed.length > 0) {
        const rows = changed.map(key => ({
          user_id: user.id,
          material_key: key,
          data: next[key],
          updated_at: new Date().toISOString(),
        }))
        supabase.from('material_prices')
          .upsert(rows, { onConflict: 'user_id,material_key' })
          .then(({ error }) => error && console.error('[MaterialHistory] sync error', error))
      }

      return next
    })
  }, [user])

  // ── Autocomplete helpers ──────────────────────────────────────────────────
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

