export default function Input({
  label, error, className = '', type = 'text',
  hint, ...props
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full bg-gray-900 border rounded-lg px-3 py-2 text-sm text-gray-100
          placeholder:text-gray-600 focus:outline-none focus:ring-2
          transition-colors duration-150
          ${error
            ? 'border-red-500/60 focus:ring-red-500/40'
            : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/30'
          }
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        rows={4}
        className={`
          w-full bg-gray-900 border rounded-lg px-3 py-2 text-sm text-gray-100
          placeholder:text-gray-600 focus:outline-none focus:ring-2
          resize-y font-mono transition-colors duration-150
          ${error
            ? 'border-red-500/60 focus:ring-red-500/40'
            : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/30'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
          focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/30
          transition-colors duration-150 ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
