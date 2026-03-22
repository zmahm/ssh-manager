import { motion } from 'framer-motion'
import AnimatedNumber from '../shared/AnimatedNumber'

export default function StatCard({ title, value, suffix = '', decimals = 0, subtitle, color = '#6366f1', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {subtitle && <span className="text-xs text-gray-600">{subtitle}</span>}
      </div>
      {value !== undefined && (
        <div className="text-2xl font-bold font-mono" style={{ color }}>
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </div>
      )}
      {children}
    </motion.div>
  )
}

// Circular gauge SVG
export function Gauge({ value, max = 100, color = '#6366f1', size = 80, label }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)
  const dash = pct * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e293b" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      {label && <span className="text-xs text-gray-500 -mt-1">{label}</span>}
    </div>
  )
}
