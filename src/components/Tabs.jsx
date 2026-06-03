import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const tabs = [
  { id: 'craft', labelKey: 'tabs.craft', icon: '⚒️' },
  { id: 'flip', labelKey: 'tabs.flip', icon: '🔄' },
  { id: 'compare', labelKey: 'tabs.compare', icon: '📊' },
]

export default function Tabs({ activeTab, onTabChange }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-1 border-b border-slate-700/50 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
            activeTab === tab.id
              ? 'text-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <span className="mr-1.5">{tab.icon}</span>
          {t(tab.labelKey)}
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
