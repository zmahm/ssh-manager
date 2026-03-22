import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Gauge } from './StatCard'

const CORE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f97316', '#eab308', '#f43f5e']

export default function CpuWidget({ buffer, loadAvg }) {
  const latest = buffer[buffer.length - 1]
  const cores = latest?.cores || []
  const avgUsage = cores.length ? cores.reduce((a, b) => a + b, 0) / cores.length : 0

  // Build chart data: each point has all core values
  const chartData = buffer.map((p, i) => ({
    i,
    avg: p.cores.reduce((a, b) => a + b, 0) / (p.cores.length || 1),
    ...p.cores.reduce((acc, v, ci) => ({ ...acc, [`c${ci}`]: v }), {}),
  }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPU</p>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>Load: <span className="text-gray-300">{loadAvg[0]?.toFixed(2)}</span></span>
          <span><span className="text-gray-300">{loadAvg[1]?.toFixed(2)}</span></span>
          <span><span className="text-gray-300">{loadAvg[2]?.toFixed(2)}</span></span>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {/* Overall gauge */}
        <div className="flex flex-col items-center gap-1">
          <Gauge value={avgUsage} color="#6366f1" size={72} />
          <span className="text-lg font-bold font-mono text-indigo-400">{avgUsage.toFixed(1)}%</span>
          <span className="text-xs text-gray-600">avg</span>
        </div>
        {/* Per-core gauges */}
        <div className="flex flex-wrap gap-2 flex-1">
          {cores.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <Gauge value={v} color={CORE_COLORS[i % CORE_COLORS.length]} size={48} />
              <span className="text-xs text-gray-500">c{i}</span>
              <span className="text-xs font-mono text-gray-300">{v.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rolling line chart */}
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="i" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            formatter={(v) => [`${v.toFixed(1)}%`]}
            labelFormatter={() => ''}
          />
          <Line
            type="monotone" dataKey="avg"
            stroke="#6366f1" strokeWidth={2} dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
