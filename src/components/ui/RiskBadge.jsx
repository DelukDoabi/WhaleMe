import { useTranslation } from 'react-i18next'

export default function RiskBadge({ level }) {
  const { t } = useTranslation()
  const config = {
    low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: t('risk.low') },
    medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: t('risk.medium') },
    high: { bg: 'bg-rose-500/15', text: 'text-rose-400', label: t('risk.high') },
  }

  const { bg, text, label } = config[level] || config.high

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
