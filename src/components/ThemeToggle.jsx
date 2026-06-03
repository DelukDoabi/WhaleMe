import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('whaleme-theme')
    if (stored) return stored === 'dark'
    return true // dark by default
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      document.body.classList.add('bg-navy-950', 'text-slate-100')
      document.body.classList.remove('bg-slate-50', 'text-slate-900')
    } else {
      root.classList.remove('dark')
      document.body.classList.remove('bg-navy-950', 'text-slate-100')
      document.body.classList.add('bg-slate-50', 'text-slate-900')
    }
    localStorage.setItem('whaleme-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="w-9 h-9 flex items-center justify-center rounded-lg
                 bg-slate-800/60 border border-slate-700/50 text-slate-400
                 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {dark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}
