import { motion } from 'framer-motion'

export default function MetricCard({ label, value, colorClass = '' }) {
  return (
    <div className="metric-card">
      <div className="text-xs text-slate-400 dark:text-slate-400 mb-1">{label}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`text-xl font-semibold ${colorClass}`}
      >
        {value}
      </motion.div>
    </div>
  )
}
