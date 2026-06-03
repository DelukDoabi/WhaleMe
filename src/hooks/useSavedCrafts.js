import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STORAGE_KEY = 'whaleme_saved_crafts'

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistLocal(crafts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crafts))
}

/**
 * Hook to manage saved crafts.
 * When logged in → syncs with Supabase (cloud).
 * When anonymous → falls back to localStorage.
 */
export default function useSavedCrafts(gameId) {
  const { user } = useAuth()
  const [crafts, setCrafts] = useState(() => loadLocal())
  const [syncing, setSyncing] = useState(false)

  // Load crafts from Supabase when user logs in
  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false

    async function fetchCloud() {
      setSyncing(true)
      const { data, error } = await supabase
        .from('crafts')
        .select('craft_id, game_id, data, updated_at')
        .eq('user_id', user.id)

      if (!error && !cancelled) {
        const cloudCrafts = data.map(row => ({ ...row.data, id: row.craft_id, gameId: row.game_id, updatedAt: row.updated_at }))
        // Merge: cloud wins for conflicts, upload local-only crafts
        const localCrafts = loadLocal()
        const merged = mergeCrafts(localCrafts, cloudCrafts)
        setCrafts(merged)
        persistLocal(merged)

        // Upload local-only crafts to cloud
        const cloudIds = new Set(data.map(r => r.craft_id))
        const localOnly = localCrafts.filter(c => !cloudIds.has(c.id))
        if (localOnly.length > 0) {
          const rows = localOnly.map(c => ({
            user_id: user.id,
            craft_id: c.id,
            game_id: c.gameId,
            data: c,
            updated_at: c.updatedAt || new Date().toISOString(),
          }))
          await supabase.from('crafts').upsert(rows, { onConflict: 'user_id,craft_id' })
        }
      }
      if (!cancelled) setSyncing(false)
    }

    fetchCloud()
    return () => { cancelled = true }
  }, [user])

  const gameCrafts = crafts.filter(c => c.gameId === gameId)

  const saveCraft = useCallback(async (craft) => {
    const now = new Date().toISOString()
    const existing = crafts.find(c => c.id === craft.id)
    let updated
    if (existing) {
      updated = crafts.map(c => c.id === craft.id ? { ...craft, updatedAt: now } : c)
    } else {
      const newCraft = { ...craft, id: craft.id || Date.now().toString(), updatedAt: now }
      updated = [...crafts, newCraft]
    }
    setCrafts(updated)
    persistLocal(updated)

    const savedCraft = updated.find(c => c.updatedAt === now)

    // Sync to cloud
    if (user && supabase) {
      await supabase.from('crafts').upsert({
        user_id: user.id,
        craft_id: savedCraft.id,
        game_id: savedCraft.gameId,
        data: savedCraft,
        updated_at: now,
      }, { onConflict: 'user_id,craft_id' })
    }

    return savedCraft
  }, [crafts, user])

  const deleteCraft = useCallback(async (id) => {
    const updated = crafts.filter(c => c.id !== id)
    setCrafts(updated)
    persistLocal(updated)

    // Delete from cloud
    if (user && supabase) {
      await supabase.from('crafts').delete().eq('user_id', user.id).eq('craft_id', id)
    }
  }, [crafts, user])

  return { gameCrafts, allCrafts: crafts, saveCraft, deleteCraft, syncing }
}

/** Merge local and cloud crafts. Cloud wins on conflicts (by updatedAt). */
function mergeCrafts(local, cloud) {
  const map = new Map()
  for (const c of local) map.set(c.id, c)
  for (const c of cloud) {
    const existing = map.get(c.id)
    if (!existing || new Date(c.updatedAt) >= new Date(existing.updatedAt)) {
      map.set(c.id, c)
    }
  }
  return [...map.values()]
}
