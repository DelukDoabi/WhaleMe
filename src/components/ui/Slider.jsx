export default function Slider({ id, label, value, onChange, min = 0, max = 50, suffix = '%' }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-slate-400 block mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                     bg-slate-700 accent-violet-500
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-violet-500
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/30"
        />
        <span className="text-sm font-medium text-slate-200 min-w-[40px] text-right">
          {value}{suffix}
        </span>
      </div>
    </div>
  )
}
