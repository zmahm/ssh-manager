import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700',
  danger: 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30',
  ghost: 'hover:bg-gray-800 text-gray-400 hover:text-gray-200',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
  icon: 'p-2',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  className = '', disabled, loading, onClick, type = 'button', ...rest
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-lg font-medium
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </motion.button>
  )
}
