import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import games from '../lib/games'

export default function GameSelector({ selectedGame, onGameChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                   bg-slate-800/60 border border-slate-700/50 text-slate-300
                   hover:border-slate-600 hover:text-slate-100 transition-all duration-200"
      >
        <span>{selectedGame.icon}</span>
        <span className="font-medium">{selectedGame.name}</span>
        <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 min-w-[180px] z-50
                       bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl shadow-black/30
                       overflow-hidden"
          >
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => { onGameChange(game); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors
                  ${game.id === selectedGame.id
                    ? 'bg-violet-500/10 text-violet-300'
                    : 'text-slate-300 hover:bg-slate-800'
                  }`}
              >
                <span className="text-base">{game.icon}</span>
                <div>
                  <div className="font-medium">{game.name}</div>
                  <div className="text-[10px] text-slate-500">{game.description}</div>
                </div>
                {game.id === selectedGame.id && (
                  <svg className="w-4 h-4 ml-auto text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}

            {games.length === 1 && (
              <div className="px-3.5 py-2 text-[10px] text-slate-600 border-t border-slate-700/50">
                {t('gameSelector.moreGames')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
