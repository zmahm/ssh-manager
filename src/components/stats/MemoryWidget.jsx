import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatKb } from '../../utils/formatBytes'
import { Gauge } from './StatCard'

export default function MemoryWidget({ buffer }) {
  const latest = buffer[buffer.length - 1] || {}
  const usedPct = latest.totalKb ? (latest.usedKb / latest.totalKb) * 100 : 0

  const chartData = buffer.map((p, i) => ({
    i,
    used: Math.round(p.usedKb / 1024),       // MB
    cached: Math.round((p.cachedKb || 0) / 1024),
  }))

  // Dynamic Y-axis: window tightly around the visible data range so small
  // fluctuations are visible regardless of total RAM size.
  const usedValues = chartData.map(p => p.used).filter(v => v > 0)
  const windowMin = usedValues.length ? Math.floor(Math.min(...usedValues) * 0.92) : 0
  const windowMax = usedValues.length ? Math.ceil(Math.max(...usedValues) * 1.08) : 1024

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Memory</p>

      <div className="flex gap-4 mb-4 items-center">
        <div className="flex flex-col items-center gap-1">
          <Gauge
            value={usedPct}
            color={usedPct > 85 ? '#ef4444' : usedPct > 60 ? '#f97316' : '#22c55e'}
            size={72}
          />
          <span className="text-lg font-bold font-mono text-emerald-400">{usedPct.toFixed(1)}%</span>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Total</span>
            <span className="text-gray-300 font-mono">{formatKb(latest.totalKb || 0)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Used</span>
            <span className="text-indigo-400 font-mono">{formatKb(latest.usedKb || 0)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Free</span>
            <span className="text-gray-300 font-mono">{formatKb(latest.availableKb || 0)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Cached</span>
            <span className="text-gray-400 font-mono">{formatKb(latest.cachedKb || 0)}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis domain={[windowMin, windowMax]} hide />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            formatter={(v, name) => [`${v} MB`, name === 'used' ? 'Used' : 'Cached']}
            labelFormatter={() => `range ${windowMin}–${windowMax} MB`}
          />
          <Area
            type="monotone" dataKey="used"
            stroke="#6366f1" strokeWidth={2}
            fill="url(#memGrad)"
            dot={false} isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
