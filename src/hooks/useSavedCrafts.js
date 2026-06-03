import { useState, useCallback } from 'react'

const STORAGE_KEY = 'whaleme_saved_crafts'

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(crafts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crafts))
}

/**
 * Hook to manage saved crafts in localStorage.
 * Each craft: { id, name, gameId, qty, materials, taxRate, regFee, salePrice, updatedAt }
 */
export default function useSavedCrafts(gameId) {
  const [crafts, setCrafts] = useState(() => loadAll())

  const gameCrafts = crafts.filter(c => c.gameId === gameId)

  const saveCraft = useCallback((craft) => {
    const now = new Date().toISOString()
    const existing = crafts.find(c => c.id === craft.id)
    let updated
    if (existing) {
      updated = crafts.map(c => c.id === craft.id ? { ...craft, updatedAt: now } : c)
    } else {
      updated = [...crafts, { ...craft, id: Date.now().toString(), updatedAt: now }]
    }
    setCrafts(updated)
    persist(updated)
    return updated.find(c => c.updatedAt === now)
  }, [crafts])

  const deleteCraft = useCallback((id) => {
    const updated = crafts.filter(c => c.id !== id)
    setCrafts(updated)
    persist(updated)
  }, [crafts])

  return { gameCrafts, allCrafts: crafts, saveCraft, deleteCraft }
}
