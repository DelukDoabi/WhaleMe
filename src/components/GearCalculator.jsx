import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useSavedCrafts from '../hooks/useSavedCrafts'
import { useMaterialHistory } from '../contexts/MaterialHistoryContext'
import MaterialInput from './ui/MaterialInput'

// White → Green → Blue → Yellow → Red
const TIERS = [
  { key: 'white',  label: 'Common',  color: 'text-slate-300',  bg: 'bg-slate-500/20',  border: 'border-slate-500/40',  dot: 'bg-slate-400' },
  { key: 'green',  label: 'Rare',    color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40',  dot: 'bg-green-400' },
  { key: 'blue',   label: 'Epic',    color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   dot: 'bg-blue-400' },
  { key: 'yellow', label: 'Unique',  color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', dot: 'bg-yellow-400' },
  { key: 'red',    label: 'Heroic',  color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40',    dot: 'bg-red-400' },
]

const PROC = 0.25            // 25% chance to upgrade
const EXP_CRAFTS = 1 / PROC  // 4 crafts expected per proc

function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return '—'
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M Ꝃ`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}k Ꝃ`
  return `${Math.round(v).toLocaleString()} Ꝃ`
}

function pcolor(v) {
  if (v > 0) return 'text-emerald-400'
  if (v < 0) return 'text-rose-400'
  return 'text-slate-400'
}

function TierPill({ tier, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
        disabled
          ? 'opacity-30 cursor-not-allowed bg-transparent text-slate-600 border-transparent'
          : active
            ? `${tier.bg} ${tier.color} ${tier.border}`
            : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/40'
      }`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${tier.dot} mr-1.5`}></span>
      {tier.label}
    </button>
  )
}

function MaterialsPopup({ tier, tierData, t, onClose, onAdd, onUpdate, onRemove, total }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-md card border border-slate-600/50 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${tier.dot}`}></span>
            <span className={tier.color}>{tier.label}</span>
            <span className="text-slate-400 font-normal text-xs">— {t('gear.materialsTitle')}</span>
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/50 transition-colors">✕</button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_90px_60px_28px] gap-2 text-[10px] uppercase text-slate-500 tracking-wide px-1 mb-1">
          <span>{t('craft.material')}</span>
          <span>{t('craft.unitCost')}</span>
          <span>{t('craft.qty')}</span>
          <span></span>
        </div>

        {/* Material rows */}
        <div className="space-y-1.5 mb-3">
          {tierData.materials.map(mat => (
            <div key={mat.id} className="grid grid-cols-[1fr_90px_60px_28px] gap-2 items-center">
              <MaterialInput
                value={mat.name}
                onChange={val => onUpdate(mat.id, 'name', val)}
                onPriceSelect={price => onUpdate(mat.id, 'unitCost', price)}
                placeholder={t('craft.material')}
              />
              <input type="number" className="input-field text-xs" min={0} placeholder="0"
                value={mat.unitCost}
                onChange={e => onUpdate(mat.id, 'unitCost', e.target.value === '' ? '' : Number(e.target.value))}
              />
              <input type="number" className="input-field text-xs" min={1} placeholder="1"
                value={mat.qty}
                onChange={e => onUpdate(mat.id, 'qty', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              />
              <button onClick={() => onRemove(mat.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs"
              >✕</button>
            </div>
          ))}
        </div>

        <button onClick={onAdd} className="btn btn-ghost text-xs w-full mb-4">
          {t('craft.addMaterial')}
        </button>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-slate-700/50 pt-3">
          <span className="text-xs text-slate-400">{t('gear.materialsTotal')}</span>
          <span className="text-base font-semibold text-slate-100">{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

export default function GearCalculator({ game }) {
  const { t } = useTranslation()

  const gearGameId = (game?.id ?? 'aion2') + '_gear'
  const { gameCrafts, saveCraft, deleteCraft } = useSavedCrafts(gearGameId)
  const { recordPrices } = useMaterialHistory()

  const [gearCraftName, setGearCraftName] = useState('')
  const [currentGearCraftId, setCurrentGearCraftId] = useState(null)

  const [tiers, setTiers] = useState(() =>
    Object.fromEntries(TIERS.map(t => [t.key, {
      materials: [{ id: 1, name: '', unitCost: '', qty: 1 }],
      nextMatId: 2,
      regFee: '',
      salePrice: '',
      rawSalePrice: '',
      taxRate: 20,
    }]))
  )
  const [openPopupTier, setOpenPopupTier] = useState(null)
  const [craftTierKey, setCraftTierKey] = useState('white')
  const [targetTierKey, setTargetTierKey] = useState('yellow')
  const [mode, setMode] = useState('chain') // 'sellAll' | 'chain'
  const [nCrafts, setNCrafts] = useState(20)
  const [trashIntermediates, setTrashIntermediates] = useState(false)

  const craftIdx  = TIERS.findIndex(t => t.key === craftTierKey)
  const targetIdx = TIERS.findIndex(t => t.key === targetTierKey)

  // Auto-adjust target when craft tier changes
  useEffect(() => {
    if (targetIdx <= craftIdx) {
      const next = TIERS[craftIdx + 1]?.key
      if (next) setTargetTierKey(next)
    }
  }, [craftTierKey]) // eslint-disable-line

  const updateTier = (key, field, value) =>
    setTiers(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))

  const addMaterial = useCallback((tierKey) => {
    setTiers(prev => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        materials: [...prev[tierKey].materials, { id: prev[tierKey].nextMatId, name: '', unitCost: '', qty: 1 }],
        nextMatId: prev[tierKey].nextMatId + 1,
      }
    }))
  }, [])

  const updateMaterial = useCallback((tierKey, matId, field, value) => {
    setTiers(prev => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        materials: prev[tierKey].materials.map(m => m.id === matId ? { ...m, [field]: value } : m),
      }
    }))
  }, [])

  const removeMaterial = useCallback((tierKey, matId) => {
    setTiers(prev => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        materials: prev[tierKey].materials.filter(m => m.id !== matId),
      }
    }))
  }, [])

  // ── SAVE / LOAD HANDLERS ─────────────────────────────────────────────────
  const defaultTiers = () =>
    Object.fromEntries(TIERS.map(t => [t.key, {
      materials: [{ id: 1, name: '', unitCost: '', qty: 1 }],
      nextMatId: 2,
      regFee: '',
      salePrice: '',
      rawSalePrice: '',
      taxRate: 20,
    }]))

  const handleSaveGear = () => {
    const craft = {
      id: currentGearCraftId,
      name: gearCraftName.trim() || t('gear.unnamedBuild'),
      gameId: gearGameId,
      tiers,
      craftTierKey,
      targetTierKey,
      mode,
      nCrafts,
      trashIntermediates,
    }
    const saved = saveCraft(craft)
    setCurrentGearCraftId(saved.id)
    const allMaterials = Object.values(tiers).flatMap(t => t.materials || [])
    recordPrices(allMaterials)
  }

  const handleLoadGear = (craft) => {
    setCurrentGearCraftId(craft.id)
    setGearCraftName(craft.name)
    setTiers(craft.tiers)
    setCraftTierKey(craft.craftTierKey ?? 'white')
    setTargetTierKey(craft.targetTierKey ?? 'yellow')
    setMode(craft.mode ?? 'chain')
    setNCrafts(craft.nCrafts ?? 20)
    setTrashIntermediates(craft.trashIntermediates ?? false)
  }

  const handleNewGear = () => {
    setCurrentGearCraftId(null)
    setGearCraftName('')
    setTiers(defaultTiers())
    setCraftTierKey('white')
    setTargetTierKey('yellow')
    setMode('chain')
    setNCrafts(20)
    setTrashIntermediates(false)
  }

  const handleDeleteGear = (id) => {
    deleteCraft(id)
    if (currentGearCraftId === id) handleNewGear()
  }

  // Computed mat cost from materials list
  const matCostOf = (key) =>
    (tiers[key]?.materials || []).reduce((s, m) => s + (Number(m.unitCost) || 0) * (Number(m.qty) || 1), 0)

  const num     = (key, field) => Number(tiers[key]?.[field]) || 0
  // Net revenue after selling one finished item (after tax & reg fee)
  const netItem    = (key) => num(key, 'salePrice')    * (1 - num(key, 'taxRate') / 100) - num(key, 'regFee')
  // Net revenue after selling one RAW proc item of this tier
  const netRawSale = (key) => num(key, 'rawSalePrice') * (1 - num(key, 'taxRate') / 100) - num(key, 'regFee')
  // Best proc revenue: raw sale if priced, otherwise finished item
  const procRev    = (key) => { const r = netRawSale(key); return r > 0 ? r : netItem(key) }

  // ── SELL ALL MODE ─────────────────────────────────────────────────────────
  const sellAll = useMemo(() => {
    const nextKey   = TIERS[craftIdx + 1]?.key
    const cost      = matCostOf(craftTierKey)
    const baseRev   = 0.75 * netItem(craftTierKey)
    // If raw price is set for the next tier, use it (player sells the proc raw); otherwise assume finished
    const pRev      = nextKey ? 0.25 * procRev(nextKey) : 0
    const revPerCraft    = baseRev + pRev
    const profitPerCraft = revPerCraft - cost

    const rows = []
    const step = Math.max(1, Math.ceil(nCrafts / 10))
    for (let n = step; n <= nCrafts; n += step) {
      rows.push({ n, cost: n * cost, rev: n * revPerCraft, profit: n * (revPerCraft - cost) })
    }
    if (!rows.length || rows[rows.length - 1].n !== nCrafts) {
      rows.push({ n: nCrafts, cost: nCrafts * cost, rev: nCrafts * revPerCraft, profit: nCrafts * profitPerCraft })
    }

    const procUsesRaw = nextKey && netRawSale(nextKey) > 0
    return { cost, revPerCraft, profitPerCraft, rows, nextKey, procUsesRaw }
  }, [craftTierKey, tiers, nCrafts, craftIdx]) // eslint-disable-line

  // ── CHAIN MODE ────────────────────────────────────────────────────────────
  const chain = useMemo(() => {
    if (targetIdx <= craftIdx) return null

    const stages = []
    for (let i = craftIdx; i < targetIdx; i++) {
      const tk      = TIERS[i].key
      const nextKey = TIERS[i + 1].key

      // ── Craft cost / byproduct base ──────────────────────────────────────
      // Expected: 4 crafts → 3 base byproducts + 1 raw proc of next tier
      const grossCost    = EXP_CRAFTS * matCostOf(tk)
      const byproductRev = trashIntermediates ? 0 : (EXP_CRAFTS - 1) * netItem(tk)
      const stageCostNet = grossCost - byproductRev   // net cost to obtain 1 raw of nextKey

      // ── Option A — sell the raw proc ─────────────────────────────────────
      const rawSaleNet    = netRawSale(nextKey)
      const rawSellProfit = rawSaleNet - stageCostNet
      const hasRawPrice   = rawSaleNet > 0

      // ── Option B — craft the raw into a finished item and sell ───────────
      // (craft one finished nextKey item from the raw, spending matCostOf(nextKey))
      const craftFinishCost    = matCostOf(nextKey)
      const craftFinishedValue = netItem(nextKey)
      const craftImmProfit     = craftFinishedValue - stageCostNet - craftFinishCost

      const rawIsBetter = hasRawPrice && rawSellProfit > craftImmProfit

      stages.push({
        tier: TIERS[i], procTier: TIERS[i + 1],
        grossCost, byproductRev, netCost: stageCostNet,
        rawSaleNet, rawSellProfit, hasRawPrice,
        craftFinishCost, craftFinishedValue, craftImmProfit,
        rawIsBetter,
      })
    }

    const totalGross     = stages.reduce((s, st) => s + st.grossCost, 0)
    const totalByproduct = stages.reduce((s, st) => s + st.byproductRev, 0)
    const netInvestment  = totalGross - totalByproduct
    const targetValue    = netItem(targetTierKey)
    const profit         = targetValue - netInvestment
    const totalExpCrafts = stages.length * EXP_CRAFTS

    return { stages, totalGross, totalByproduct, netInvestment, targetValue, profit, totalExpCrafts }
  }, [craftTierKey, targetTierKey, tiers, craftIdx, targetIdx, trashIntermediates]) // eslint-disable-line

  const craftTier  = TIERS[craftIdx]
  const targetTier = TIERS[targetIdx]

  return (
    <div className="space-y-5">

      {/* ── SAVED GEAR BUILDS ────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">{t('gear.savedBuilds')}</h3>
            {gameCrafts.length > 0 ? (
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {gameCrafts.map(c => (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => handleLoadGear(c)}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                        currentGearCraftId === c.id
                          ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                          : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(c.updatedAt ?? c.id).toLocaleDateString()}
                      </span>
                      <span
                        role="button"
                        onClick={e => { e.stopPropagation(); handleDeleteGear(c.id) }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all ml-0.5"
                      >✕</span>
                    </motion.button>
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <p className="text-xs text-slate-600 italic">{t('gear.noSavedBuilds')}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleNewGear} className="btn btn-ghost text-xs whitespace-nowrap">
              + {t('gear.newBuild')}
            </button>
            <input
              type="text"
              className="input-field text-xs w-36"
              placeholder={t('gear.buildName')}
              value={gearCraftName}
              onChange={e => setGearCraftName(e.target.value)}
            />
            <button onClick={handleSaveGear} className="btn btn-primary text-xs whitespace-nowrap">
              {t('gear.save')}
            </button>
          </div>
        </div>
      </div>

      {/* ── TIER PRICE TABLE ─────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">{t('gear.tierConfig')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wide">
                <th className="text-left pb-3 pr-4 font-medium w-24">Tier</th>
                <th className="text-left pb-3 pr-2 font-medium">{t('gear.matCost')}</th>
                <th className="text-left pb-3 pr-2 font-medium">{t('gear.regFee')}</th>
                <th className="text-left pb-3 pr-2 font-medium">{t('gear.salePrice')}</th>
                <th className="text-left pb-3 pr-2 font-medium">
                  <span className="flex items-center gap-1">
                    {t('gear.rawPrice')}
                    <span title={t('gear.rawPriceHint')} className="cursor-help text-slate-600 hover:text-slate-400 text-[11px]">ⓘ</span>
                  </span>
                </th>
                <th className="text-left pb-3 font-medium">{t('gear.tax')}</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map(tier => (
                <tr key={tier.key} className="border-t border-slate-800/40">
                  <td className="py-2 pr-4">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${tier.color}`}>
                      <span className={`w-2 h-2 rounded-full ${tier.dot}`}></span>
                      {tier.label}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    <button
                      onClick={() => setOpenPopupTier(tier.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors min-w-[110px] ${
                        matCostOf(tier.key) > 0
                          ? 'bg-slate-700/40 border-slate-600/50 text-slate-200 hover:border-violet-500/50'
                          : 'bg-slate-800/40 border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span>📦</span>
                      <span className="flex-1 text-left">
                        {matCostOf(tier.key) > 0 ? fmt(matCostOf(tier.key)) : t('gear.setMaterials')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {tiers[tier.key].materials.filter(m => Number(m.unitCost) > 0).length > 0
                          ? `${tiers[tier.key].materials.filter(m => Number(m.unitCost) > 0).length}×`
                          : ''}
                      </span>
                    </button>
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min={0} placeholder="0"
                      className="input-field text-xs w-24"
                      value={tiers[tier.key].regFee}
                      onChange={e => updateTier(tier.key, 'regFee', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min={0} placeholder="0"
                      className="input-field text-xs w-28"
                      value={tiers[tier.key].salePrice}
                      onChange={e => updateTier(tier.key, 'salePrice', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min={0} placeholder="—"
                      className={`input-field text-xs w-24 ${tiers[tier.key].rawSalePrice ? 'border-amber-500/40 text-amber-300' : ''}`}
                      value={tiers[tier.key].rawSalePrice}
                      onChange={e => updateTier(tier.key, 'rawSalePrice', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {[10, 20].map(rate => (
                        <button key={rate}
                          onClick={() => updateTier(tier.key, 'taxRate', rate)}
                          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                            tiers[tier.key].taxRate === rate
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >{rate}%</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-600 mt-3">{t('gear.taxHint')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: CONTROLS ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Craft tier selector */}
          <div className="card">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">{t('gear.craftTier')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {TIERS.slice(0, 4).map(tier => (
                <TierPill key={tier.key} tier={tier}
                  active={craftTierKey === tier.key}
                  onClick={() => setCraftTierKey(tier.key)}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">{t('gear.procHint')}</p>
          </div>

          {/* Mode selector */}
          <div className="card">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">{t('gear.mode.label')}</h3>
            <div className="flex gap-2">
              {['sellAll', 'chain'].map(m => (
                <button key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                    mode === m
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {t(`gear.mode.${m}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Sell-all: craft count slider */}
          {mode === 'sellAll' && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-slate-400">{t('gear.simulate')}</label>
                <span className="text-xs text-violet-300 font-medium">{nCrafts} crafts</span>
              </div>
              <input type="range" min={4} max={200} step={4}
                value={nCrafts}
                onChange={e => setNCrafts(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          )}

          {/* Chain: target tier selector */}
          {mode === 'chain' && (
            <div className="card">
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">{t('gear.targetTier')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {TIERS.map((tier, i) => (
                  <TierPill key={tier.key} tier={tier}
                    active={targetTierKey === tier.key}
                    disabled={i <= craftIdx}
                    onClick={() => setTargetTierKey(tier.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Chain: trash intermediates toggle */}
          {mode === 'chain' && (
            <button
              onClick={() => setTrashIntermediates(v => !v)}
              className={`w-full card flex items-center justify-between gap-3 text-left transition-colors border ${
                trashIntermediates
                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                  : 'border-slate-700/30 hover:border-slate-600/50'
              }`}
            >
              <div>
                <p className={`text-xs font-medium ${trashIntermediates ? 'text-amber-300' : 'text-slate-300'}`}>
                  🗑️ {t('gear.trashIntermediates')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{t('gear.trashIntermediatesDesc')}</p>
              </div>
              {/* Toggle pill */}
              <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                trashIntermediates ? 'bg-amber-500' : 'bg-slate-700'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  trashIntermediates ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </button>
          )}

          {/* Context note */}
          <div className="card bg-slate-800/30 border border-slate-700/30">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t('gear.contextNote')}
            </p>
          </div>
        </div>

        {/* ── RIGHT: RESULTS ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* ── SELL ALL MODE ───────────────────────────────────────────── */}
          {mode === 'sellAll' && (
            <>
              {/* Per-craft summary */}
              <div className="card">
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${craftTier.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${craftTier.dot}`}></span>
                    {craftTier.label}
                  </span>
                  <span className="text-slate-600 text-xs">75% →</span>
                  <span className={`text-xs font-medium ${craftTier.color}`}>{craftTier.label}</span>
                  <span className="text-slate-600 text-xs ml-2">25% →</span>
                  {sellAll.nextKey ? (
                    <span className={`text-xs font-medium ${TIERS[craftIdx + 1].color}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${TIERS[craftIdx + 1].dot} mr-1`}></span>
                      {TIERS[craftIdx + 1].label}
                    </span>
                  ) : <span className="text-xs text-slate-600">—</span>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('gear.craftCost'),   value: fmt(sellAll.cost),         color: 'text-rose-400' },
                    { label: t('gear.expRevenue'),   value: fmt(sellAll.revPerCraft),  color: 'text-slate-200' },
                    { label: t('gear.expProfit'),    value: fmt(sellAll.profitPerCraft), color: pcolor(sellAll.profitPerCraft) },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-800/40 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-sm font-semibold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                  sellAll.profitPerCraft > 0
                    ? 'bg-emerald-500/10 text-emerald-400/80'
                    : 'bg-rose-500/10 text-rose-400/80'
                }`}>
                  {sellAll.profitPerCraft > 0 ? t('gear.profitable') : t('gear.notProfitable')}
                </div>
                {sellAll.procUsesRaw && (
                  <p className="mt-2 text-[10px] text-amber-400/70">
                    🏷️ {t('gear.procUsingRaw')}
                  </p>
                )}
              </div>

              {/* Simulation table */}
              <div className="card">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                  {t('gear.simulation', { n: nCrafts })}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-800">
                        <th className="text-left pb-2 font-medium">{t('gear.table.crafts')}</th>
                        <th className="text-right pb-2 font-medium">{t('gear.table.totalCost')}</th>
                        <th className="text-right pb-2 font-medium">{t('gear.table.totalRevenue')}</th>
                        <th className="text-right pb-2 font-medium">{t('gear.table.profit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellAll.rows.map(row => (
                        <tr key={row.n} className="border-t border-slate-800/50">
                          <td className="py-1.5 text-slate-300">{row.n}×</td>
                          <td className="py-1.5 text-right text-rose-400/80">{fmt(row.cost)}</td>
                          <td className="py-1.5 text-right text-slate-300">{fmt(row.rev)}</td>
                          <td className={`py-1.5 text-right font-medium ${pcolor(row.profit)}`}>{fmt(row.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── CHAIN MODE ──────────────────────────────────────────────── */}
          {mode === 'chain' && chain && (
            <>
              {/* Stage breakdown */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('gear.chainTitle', { tier: targetTier.label })}
                  </h3>
                  {trashIntermediates && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      🗑️ {t('gear.worstCase')}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {chain.stages.map((stage) => (
                    <div key={stage.tier.key} className={`rounded-lg p-3 border ${stage.tier.border} ${stage.tier.bg}`}>
                      {/* Stage header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`font-medium ${stage.tier.color}`}>{stage.tier.label}</span>
                          <span className="text-slate-500">→</span>
                          <span className={`font-medium ${stage.procTier.color}`}>
                            {t('gear.rawLabel', { tier: stage.procTier.label })}
                          </span>
                          <span className="text-slate-500 ml-1">~4 crafts</span>
                        </div>
                        <span className={`text-xs font-semibold ${pcolor(-stage.netCost)}`}>
                          {fmt(stage.netCost)} net
                        </span>
                      </div>

                      {/* Cost breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">{t('gear.grossCost')}</span>
                          <span className="text-rose-400/80">{fmt(stage.grossCost)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">{t('gear.byproducts')}</span>
                          {trashIntermediates
                            ? <span className="text-slate-600 line-through text-[10px]">{t('gear.trashed')}</span>
                            : <span className="text-emerald-400/80">+{fmt(stage.byproductRev)}</span>
                          }
                        </div>
                        <div>
                          <span className="text-slate-500 block">{t('gear.netCost')}</span>
                          <span className={stage.netCost > 0 ? 'text-rose-400' : 'text-emerald-400'}>{fmt(stage.netCost)}</span>
                        </div>
                      </div>

                      {/* ── Decision: Sell Raw vs Craft Finished ─────────── */}
                      <div className="mt-3 pt-2.5 border-t border-slate-700/40">
                        <div className="text-[9px] uppercase text-slate-600 tracking-widest mb-2">{t('gear.decision')}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Sell Raw */}
                          <div className={`rounded-lg p-2.5 border transition-all ${
                            stage.rawIsBetter
                              ? `${stage.procTier.bg} ${stage.procTier.border}`
                              : 'bg-slate-800/30 border-slate-700/20 opacity-60'
                          }`}>
                            <div className="text-[10px] text-slate-400 mb-1">
                              🏷️ {t('gear.sellRaw')}
                            </div>
                            {stage.hasRawPrice ? (
                              <>
                                <div className="text-[10px] text-slate-500">{fmt(stage.rawSaleNet)}</div>
                                <div className={`text-sm font-bold ${pcolor(stage.rawSellProfit)}`}>
                                  {fmt(stage.rawSellProfit)}
                                </div>
                              </>
                            ) : (
                              <div className="text-[10px] text-slate-600 italic">{t('gear.noRawPrice')}</div>
                            )}
                          </div>

                          {/* Craft Finished */}
                          <div className={`rounded-lg p-2.5 border transition-all ${
                            !stage.rawIsBetter && stage.craftFinishedValue > 0
                              ? `${stage.procTier.bg} ${stage.procTier.border}`
                              : 'bg-slate-800/30 border-slate-700/20 opacity-60'
                          }`}>
                            <div className="text-[10px] text-slate-400 mb-1">
                              ⚒️ {t('gear.craftFinished')}
                            </div>
                            {stage.craftFinishedValue > 0 ? (
                              <>
                                <div className="text-[10px] text-slate-500">{fmt(stage.craftFinishedValue)}</div>
                                <div className={`text-sm font-bold ${pcolor(stage.craftImmProfit)}`}>
                                  {fmt(stage.craftImmProfit)}
                                </div>
                              </>
                            ) : (
                              <div className="text-[10px] text-slate-600 italic">{t('gear.noPrice')}</div>
                            )}
                          </div>
                        </div>

                        {/* Recommendation line */}
                        {stage.hasRawPrice && stage.craftFinishedValue > 0 && (
                          <div className={`mt-2 text-[10px] text-center font-medium px-2 py-1 rounded ${
                            stage.rawIsBetter
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-violet-500/10 text-violet-400'
                          }`}>
                            {stage.rawIsBetter
                              ? `→ ${t('gear.recommendSellRaw')} (+${fmt(stage.rawSellProfit - stage.craftImmProfit)})`
                              : `→ ${t('gear.recommendCraft')} (+${fmt(stage.craftImmProfit - stage.rawSellProfit)})`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final verdict */}
              <div className="card">
                <div className="space-y-0">
                  {[
                    { label: t('gear.totalGross'),     value: fmt(chain.totalGross),      color: 'text-rose-400' },
                    {
                      label: t('gear.totalByproduct'),
                      value: trashIntermediates ? `— (${t('gear.trashed')})` : `+${fmt(chain.totalByproduct)}`,
                      color: trashIntermediates ? 'text-slate-600 line-through' : 'text-emerald-400',
                    },
                    { label: t('gear.netInvestment'),  value: fmt(chain.netInvestment),   color: 'text-slate-200 font-semibold' },
                    { label: `${targetTier.label} ${t('gear.saleValue')}`, value: fmt(chain.targetValue), color: `${targetTier.color} font-medium` },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-slate-800/50">
                      <span className="text-xs text-slate-400">{label}</span>
                      <span className={`text-sm ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className={`flex justify-between items-center px-4 py-3 rounded-lg mt-3 border ${
                  chain.profit > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <span className={`text-sm font-medium ${chain.profit > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {chain.profit > 0 ? t('gear.verdict.profitable') : t('gear.verdict.loss')}
                  </span>
                  <span className={`text-lg font-bold ${pcolor(chain.profit)}`}>{fmt(chain.profit)}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-3">
                  {t('gear.expectedCraftsNote', { n: Math.round(chain.totalExpCrafts) })}
                </p>
              </div>
            </>
          )}

          {mode === 'chain' && (!chain || targetIdx <= craftIdx) && (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <span className="text-3xl mb-3">⚔️</span>
              <p className="text-sm text-slate-400">{t('gear.selectTarget')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Materials popup */}
      {openPopupTier && (() => {
        const tier = TIERS.find(t => t.key === openPopupTier)
        return (
          <MaterialsPopup
            tier={tier}
            tierData={tiers[openPopupTier]}
            t={t}
            total={matCostOf(openPopupTier)}
            onClose={() => setOpenPopupTier(null)}
            onAdd={() => addMaterial(openPopupTier)}
            onUpdate={(matId, field, value) => updateMaterial(openPopupTier, matId, field, value)}
            onRemove={(matId) => removeMaterial(openPopupTier, matId)}
          />
        )
      })()}
    </div>
  )
}
