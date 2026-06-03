import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find(l => l.code === i18n.language) || languages[0]

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
                   bg-slate-800/60 border border-slate-700/50 text-slate-300
                   hover:border-slate-600 hover:text-slate-100 transition-all duration-200"
      >
        <span>{current.flag}</span>
        <svg className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="absolute top-full mt-1.5 right-0 min-w-[150px] z-50
                       bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl shadow-black/30
                       overflow-hidden"
          >
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors
                  ${lang.code === current.code
                    ? 'bg-violet-500/10 text-violet-300'
                    : 'text-slate-300 hover:bg-slate-800'
                  }`}
              >
                <span>{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
