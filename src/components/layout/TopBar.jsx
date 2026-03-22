import { motion } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import useSessionStore from '../../store/sessionStore'
import Button from '../shared/Button'

export default function TopBar() {
  const lock = useAuthStore(s => s.lock)
  const activeTab = useSessionStore(s => s.getActiveTab())

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5M12 19.5V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
        </svg>
        <span className="text-sm font-semibold text-gray-200 hidden sm:block">SSH Manager</span>
      </div>

      {/* Active connection info */}
      {activeTab && (
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeTab.color }}
          />
          <span className="text-xs text-gray-400 font-mono">{activeTab.label}</span>
          <StatusBadge status={activeTab.status} />
        </motion.div>
      )}

      <div className="flex-1" />

      {/* Lock button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={lock}
        title="Lock app"
        className="text-gray-500 hover:text-gray-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </Button>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    connecting: ['Connecting', 'bg-yellow-400/20 text-yellow-400'],
    connected: ['Connected', 'bg-emerald-400/20 text-emerald-400'],
    closed: ['Closed', 'bg-gray-600/20 text-gray-500'],
    error: ['Error', 'bg-red-400/20 text-red-400'],
  }
  const [label, cls] = map[status] || ['', '']
  if (!label) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  )
}
