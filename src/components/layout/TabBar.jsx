import { motion, AnimatePresence } from 'framer-motion'
import useSessionStore from '../../store/sessionStore'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, setTabView } = useSessionStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  if (tabs.length === 0) return null

  return (
    <div className="flex flex-col shrink-0">
      {/* Tab strip */}
      <div className="flex items-center gap-0.5 px-2 pt-2 bg-gray-900 border-b border-gray-800 overflow-x-auto scrollbar-none">
        <AnimatePresence initial={false}>
          {tabs.map(tab => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer
                border-t border-l border-r whitespace-nowrap transition-colors
                ${activeTabId === tab.id
                  ? 'bg-gray-950 border-gray-700 text-gray-200'
                  : 'bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
              <span className="max-w-[120px] truncate">{tab.label}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View switcher for active tab */}
      {activeTab && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-950 border-b border-gray-800">
          <ViewBtn
            active={activeTab.activeView === 'terminal'}
            onClick={() => setTabView(activeTab.id, 'terminal')}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            Terminal
          </ViewBtn>
          <ViewBtn
            active={activeTab.activeView === 'stats'}
            onClick={() => setTabView(activeTab.id, 'stats')}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            Stats
          </ViewBtn>
          <ViewBtn
            active={activeTab.activeView === 'docker'}
            onClick={() => setTabView(activeTab.id, 'docker')}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          >
            Docker
          </ViewBtn>
        </div>
      )}
    </div>
  )
}

function ViewBtn({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors
        ${active
          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
        }
      `}
    >
      {icon}
      {children}
    </button>
  )
}
