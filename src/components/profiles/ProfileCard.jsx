import { motion } from 'framer-motion'
import Badge from '../shared/Badge'
import useSessionStore from '../../store/sessionStore'

export default function ProfileCard({ profile, onEdit, onDelete, isActive }) {
  const openTab = useSessionStore(s => s.openTab)

  const handleConnect = (e) => {
    e.stopPropagation()
    openTab(profile)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`
        group relative rounded-xl border p-3 cursor-pointer transition-all duration-150
        ${isActive
          ? 'bg-gray-800 border-gray-600'
          : 'bg-gray-900/60 border-gray-800 hover:bg-gray-800/60 hover:border-gray-700'
        }
      `}
      onClick={handleConnect}
    >
      {/* Color accent */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: profile.color }}
      />

      <div className="pl-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-100 truncate">{profile.label}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(profile) }}
              className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(profile) }}
              className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-0.5 truncate font-mono">
          {profile.username}@{profile.host}:{profile.port}
        </p>

        {profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.tags.slice(0, 3).map(t => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}

        {profile.lastConnected && (
          <p className="text-xs text-gray-600 mt-1.5">
            Last: {new Date(profile.lastConnected * 1000).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  )
}
