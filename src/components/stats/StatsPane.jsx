import { motion, AnimatePresence } from 'framer-motion'
import { useStats } from '../../hooks/useStats'
import CpuWidget from './CpuWidget'
import MemoryWidget from './MemoryWidget'
import GpuWidget from './GpuWidget'
import DiskWidget from './DiskWidget'
import NetworkWidget from './NetworkWidget'
import UptimeWidget from './UptimeWidget'
import ProcessTable from './ProcessTable'

const INTERVALS = [
  { label: '0.25s', value: 250 },
  { label: '0.5s', value: 500 },
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
]

export default function StatsPane({ tab }) {
  const { buffer, changeInterval, intervalMs } = useStats(tab)

  if (buffer.status === 'idle' || buffer.status === 'connecting') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Connecting to stats stream...</p>
        </div>
      </div>
    )
  }

  if (buffer.status === 'unsupported') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <p className="text-gray-400 text-sm">Stats not available</p>
          <p className="text-gray-600 text-xs mt-1">
            Platform <span className="text-gray-400">{buffer.platform}</span> is not supported.
            Stats require a Linux target with /proc filesystem.
          </p>
        </div>
      </div>
    )
  }

  if (buffer.status === 'error' || buffer.status === 'closed') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">Stats connection lost. Reconnect by switching tabs.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header with interval selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live Statistics</h2>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-1">Refresh:</span>
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

      <AnimatePresence mode="popLayout">
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* CPU — full width */}
          <CpuWidget buffer={buffer.cpu} loadAvg={buffer.loadAvg} />

          {/* Memory */}
          <MemoryWidget buffer={buffer.memory} />

          {/* Uptime / Load */}
          <UptimeWidget uptime={buffer.uptime} loadAvg={buffer.loadAvg} />

          {/* GPU (only if available) */}
          {buffer.gpu.length > 0 && (
            <GpuWidget gpus={buffer.gpu} />
          )}

          {/* Disk */}
          <DiskWidget buffer={buffer.disk} />

          {/* Network */}
          <NetworkWidget buffer={buffer.network} />

          {/* Process table — full width */}
          <ProcessTable processes={buffer.processes} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
