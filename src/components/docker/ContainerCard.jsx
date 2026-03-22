import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const STATE_STYLES = {
  running:    { dot: 'bg-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', pulse: true },
  exited:     { dot: 'bg-gray-600',    border: 'border-gray-700/50',    badge: 'bg-gray-800 text-gray-500 border-gray-700', pulse: false },
  paused:     { dot: 'bg-yellow-400',  border: 'border-yellow-500/20',  badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', pulse: false },
  restarting: { dot: 'bg-blue-400',    border: 'border-blue-500/20',    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', pulse: true },
  dead:       { dot: 'bg-red-500',     border: 'border-red-500/20',     badge: 'bg-red-500/10 text-red-400 border-red-500/20', pulse: false },
}

function getStateStyle(state) {
  return STATE_STYLES[state?.toLowerCase()] || STATE_STYLES.exited
}

function MiniChart({ data, dataKey, color, domain }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="ts" hide />
        <YAxis domain={domain || [0, 100]} hide />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 10 }}
          formatter={(v) => [`${v.toFixed(1)}%`]}
          labelFormatter={() => ''}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${dataKey}-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function ActionBtn({ onClick, disabled, title, children, variant = 'default' }) {
  const variants = {
    default: 'text-gray-500 hover:text-gray-200 hover:bg-gray-800',
    danger:  'text-gray-500 hover:text-red-400 hover:bg-red-500/10',
    primary: 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

export default function ContainerCard({ container, stats, history, onAction, onViewLogs }) {
  const [pending, setPending] = useState(null)
  const style = getStateStyle(container.state)
  const isRunning = container.state?.toLowerCase() === 'running'

  const cpuHistory = (history || []).map((p, i) => ({ i, cpuPct: p.cpuPct }))
  const memHistory = (history || []).map((p, i) => ({ i, memPct: p.memPct }))
  const cpuNow = stats?.cpu ?? 0
  const memNow = stats?.memPct ?? 0

  // Parse memory usage string e.g. "1.5GiB / 7.6GiB"
  const [memUsed, memTotal] = (stats?.memUsage || '— / —').split(' / ')

  // Parse ports into a readable list
  const ports = container.ports
    ? container.ports.split(', ').filter(Boolean).slice(0, 4)
    : []

  async function handleAction(action) {
    setPending(action)
    onAction(container.id, action)
    setTimeout(() => setPending(null), 4000)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900 border ${style.border} rounded-xl p-4 flex flex-col gap-3`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
            {style.pulse && (
              <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${style.dot} animate-ping opacity-60`} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-100 truncate leading-tight">{container.name}</p>
            <p className="text-xs text-gray-500 truncate">{container.image}</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>
          {container.state}
        </span>
      </div>

      {/* Status line */}
      <p className="text-xs text-gray-600 leading-tight truncate">{container.status}</p>

      {/* Stats charts — only for running containers */}
      {isRunning && (
        <div className="grid grid-cols-2 gap-3">
          {/* CPU */}
          <div className="bg-gray-800/50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">CPU</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{cpuNow.toFixed(1)}%</span>
            </div>
            <MiniChart data={cpuHistory} dataKey="cpuPct" color="#6366f1" domain={[0, Math.max(100, cpuNow + 10)]} />
          </div>

          {/* Memory */}
          <div className="bg-gray-800/50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">Memory</span>
              <span className="text-xs font-mono font-bold text-violet-400">{memNow.toFixed(1)}%</span>
            </div>
            <MiniChart data={memHistory} dataKey="memPct" color="#8b5cf6" domain={[0, 100]} />
          </div>
        </div>
      )}

      {/* I/O row — running only */}
      {isRunning && stats && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-800/40 rounded-lg px-2.5 py-1.5">
            <p className="text-gray-600 mb-0.5">Net I/O</p>
            <p className="text-gray-300 font-mono truncate">{stats.netIO}</p>
          </div>
          <div className="bg-gray-800/40 rounded-lg px-2.5 py-1.5">
            <p className="text-gray-600 mb-0.5">Block I/O</p>
            <p className="text-gray-300 font-mono truncate">{stats.blockIO}</p>
          </div>
        </div>
      )}

      {/* Memory usage text */}
      {isRunning && stats && (
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet-500 rounded-full"
              animate={{ width: `${Math.min(memNow, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-gray-500 shrink-0 tabular-nums">{memUsed} / {memTotal}</span>
        </div>
      )}

      {/* Port badges */}
      {ports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ports.map((p, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded font-mono border border-gray-700/50">
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 pt-1 border-t border-gray-800">
        {!isRunning && (
          <ActionBtn onClick={() => handleAction('start')} disabled={!!pending} title="Start" variant="primary">
            {pending === 'start'
              ? <div className="w-3.5 h-3.5 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
              : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            }
          </ActionBtn>
        )}
        {isRunning && (
          <ActionBtn onClick={() => handleAction('stop')} disabled={!!pending} title="Stop">
            {pending === 'stop'
              ? <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
            }
          </ActionBtn>
        )}
        <ActionBtn onClick={() => handleAction('restart')} disabled={!!pending} title="Restart">
          {pending === 'restart'
            ? <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          }
        </ActionBtn>

        <div className="flex-1" />

        <button
          onClick={onViewLogs}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Logs
        </button>

        <ActionBtn onClick={() => handleAction('remove')} disabled={!!pending} title="Remove (force)" variant="danger">
          {pending === 'remove'
            ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
          }
        </ActionBtn>
      </div>
    </motion.div>
  )
}
