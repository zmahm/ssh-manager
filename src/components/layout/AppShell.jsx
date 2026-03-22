import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import TabBar from './TabBar'
import TerminalPane from '../terminal/TerminalPane'
import StatsPane from '../stats/StatsPane'
import useSessionStore from '../../store/sessionStore'

export default function AppShell() {
  const { tabs, activeTabId } = useSessionStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-col flex-1 overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden relative">
            {/* Empty state */}
            {tabs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-800 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5M12 19.5V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Select a profile to connect</p>
                <p className="text-gray-700 text-xs mt-1">Click any profile in the sidebar to open a terminal</p>
              </motion.div>
            )}

            {/* Tab content — all mounted but only active visible */}
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`absolute inset-0 ${tab.id === activeTabId ? 'flex flex-col' : 'hidden'}`}
              >
                <AnimatePresence mode="wait">
                  {tab.activeView === 'terminal' ? (
                    <motion.div
                      key="terminal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 overflow-hidden"
                    >
                      <TerminalPane tab={tab} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 overflow-hidden"
                    >
                      <StatsPane tab={tab} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
