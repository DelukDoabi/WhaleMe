import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import Tabs from './components/Tabs'
import ThemeToggle from './components/ThemeToggle'
import GameSelector from './components/GameSelector'
import LanguageSelector from './components/LanguageSelector'
import AuthButton from './components/AuthButton'
import CraftCalculator from './components/CraftCalculator'
import FlipCalculator from './components/FlipCalculator'
import Comparator from './components/Comparator'
import games from './lib/games'

const panels = {
  craft: CraftCalculator,
  flip: FlipCalculator,
  compare: Comparator,
}

export default function App() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('craft')
  const [selectedGame, setSelectedGame] = useState(games[0])

  const ActivePanel = panels[activeTab]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 bg-navy-950/80 dark:bg-navy-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🐋</span>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-violet-200 bg-clip-text text-transparent">
              WhaleMe
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <GameSelector selectedGame={selectedGame} onGameChange={setSelectedGame} />
            <AuthButton />
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <ActivePanel game={selectedGame} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>WhaleMe — {selectedGame.name} {t('header.subtitle')} · {t('footer.tagline')}</span>
          <span className="font-mono text-[10px] text-slate-600">
            v{__APP_VERSION__}{__COMMIT_SHA__ !== 'dev' ? ` · ${__COMMIT_SHA__.slice(0, 7)}` : ''}
          </span>
        </div>
      </footer>
    </div>
  )
}
