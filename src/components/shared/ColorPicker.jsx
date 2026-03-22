const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6', '#a3e635', '#f43f5e',
]

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Color
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: c,
              boxShadow: value === c ? `0 0 0 2px #0f172a, 0 0 0 4px ${c}` : undefined,
            }}
          />
        ))}
        <input
          type="color"
          value={value || '#6366f1'}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0 p-0"
          title="Custom color"
        />
      </div>
    </div>
  )
}
