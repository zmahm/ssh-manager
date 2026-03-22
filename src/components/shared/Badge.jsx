export default function Badge({ children, color, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={color
        ? { backgroundColor: color + '22', color, border: `1px solid ${color}44` }
        : { backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
      }
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  )
}
