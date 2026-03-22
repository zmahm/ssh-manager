import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProfileList from '../profiles/ProfileList'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 48 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col bg-gray-900 border-r border-gray-800 shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
            >
              Profiles
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors ml-auto"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Profile list */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 p-2 overflow-hidden flex flex-col"
          >
            <ProfileList />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
