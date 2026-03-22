import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDocker } from '../../hooks/useDocker'
import ContainerCard from './ContainerCard'
import ContainerLogsModal from './ContainerLogsModal'

const INTERVALS = [
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
]

const STATE_ORDER = { running: 0, restarting: 1, paused: 2, exited: 3, dead: 4 }

export default function DockerPane({ tab }) {
  const { state, sendAction, getLogs, changeInterval, intervalMs } = useDocker(tab)
  const [logsModal, setLogsModal] = useState(null) // container object
  const [filter, setFilter] = useState('all') // all | running | stopped

  function openLogs(container) {
    setLogsModal(container)
    getLogs(container.id)
  }

  function closeLogsModal() {
    setLogsModal(null)
  }

  if (state.status === 'idle' || state.status === 'connecting') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Connecting to Docker...</p>
        </div>
      </div>
    )
  }

  if (state.status === 'unavailable') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">Docker not available</p>
          <p className="text-gray-600 text-xs mt-1">Docker is not installed or not accessible on this server.</p>
        </div>
      </div>
    )
  }

  if (state.status === 'error' || state.status === 'closed') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">Docker connection lost. Switch tabs to reconnect.</p>
      </div>
    )
  }

  // Sort and filter containers
  const sorted = [...state.containers].sort((a, b) =>
    (STATE_ORDER[a.state?.toLowerCase()] ?? 99) - (STATE_ORDER[b.state?.toLowerCase()] ?? 99)
  )
  const filtered = filter === 'running'
    ? sorted.filter(c => c.state?.toLowerCase() === 'running')
    : filter === 'stopped'
    ? sorted.filter(c => c.state?.toLowerCase() !== 'running')
    : sorted

  const runningCount = state.containers.filter(c => c.state?.toLowerCase() === 'running').length
  const totalCount = state.containers.length

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Docker</h2>
          {state.dockerVersion && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-mono">
              v{state.dockerVersion}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {runningCount} running
            </span>
            <span className="text-gray-700">·</span>
            <span>{totalCount} total</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center rounded-lg bg-gray-800/60 p-0.5">
            {['all', 'running', 'stopped'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-gray-700 text-gray-200'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Refresh interval */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">Refresh:</span>
            {INTERVALS.map(int => (
              <button
                key={int.value}
                onClick={() => changeInterval(int.value)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  intervalMs === int.value
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-600/40'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Container grid */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
          No containers found
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map(container => (
              <ContainerCard
                key={container.id}
                container={container}
                stats={state.statsMap[container.id]}
                history={state.statsHistory[container.id]}
                onAction={sendAction}
                onViewLogs={() => openLogs(container)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Logs modal */}
      {logsModal && (
        <ContainerLogsModal
          container={logsModal}
          logs={state.logs[logsModal.id]}
          onClose={closeLogsModal}
          onRefresh={() => getLogs(logsModal.id)}
        />
      )}
    </div>
  )
}
