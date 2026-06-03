import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tabs from './components/Tabs'
import ThemeToggle from './components/ThemeToggle'
import CraftCalculator from './components/CraftCalculator'
import FlipCalculator from './components/FlipCalculator'
import Comparator from './components/Comparator'

const panels = {
  craft: CraftCalculator,
  flip: FlipCalculator,
  compare: Comparator,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('craft')

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
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium hidden sm:inline">
              Aion 2 Market Calculator
            </span>
          </div>
          <ThemeToggle />
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
            <ActivePanel />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500">
          WhaleMe — Aion 2 Market Profit Calculator · Made for traders, by traders
        </div>
      </footer>
    </div>
  )
}
