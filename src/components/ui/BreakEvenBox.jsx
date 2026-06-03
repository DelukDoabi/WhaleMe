import { motion } from 'framer-motion'

export default function BreakEvenBox({ isLoss, label, price, children }) {
  return (
    <motion.div
      animate={isLoss ? { boxShadow: '0 0 24px rgba(244,63,94,0.15)' } : { boxShadow: '0 0 24px rgba(16,185,129,0.15)' }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl p-5 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
        isLoss
          ? 'bg-rose-500/10 border-rose-500/30'
          : 'bg-emerald-500/10 border-emerald-500/30'
      }`}
    >
      <div>
        <div className={`text-xs font-medium uppercase tracking-wide ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
          {label}
        </div>
        <motion.div
          key={price}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`text-2xl font-bold mt-1 ${isLoss ? 'text-rose-300' : 'text-emerald-300'}`}
        >
          {price}
        </motion.div>
      </div>
      {children && (
        <div className="text-right text-xs text-slate-400 space-y-0.5">
          {children}
        </div>
      )}
    </motion.div>
  )
}
