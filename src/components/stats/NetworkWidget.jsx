import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBytesPerSec } from '../../utils/formatBytes'

export default function NetworkWidget({ buffer }) {
  const latest = buffer[buffer.length - 1] || {}
  const ifaces = Object.keys(latest)

  const chartData = buffer.map((p, i) => {
    const entry = { i }
    let totalRx = 0, totalTx = 0
    for (const iface of ifaces) {
      totalRx += p[iface]?.rxBytesPerSec || 0
      totalTx += p[iface]?.txBytesPerSec || 0
    }
    return { ...entry, rx: totalRx, tx: totalTx }
  })

  const totalRx = Object.values(latest).reduce((a, v) => a + (v?.rxBytesPerSec || 0), 0)
  const totalTx = Object.values(latest).reduce((a, v) => a + (v?.txBytesPerSec || 0), 0)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Network</p>

      <div className="flex gap-6 mb-3">
        <div>
          <p className="text-xs text-gray-500">↓ RX</p>
          <p className="text-sm font-bold font-mono text-emerald-400">{formatBytesPerSec(totalRx)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">↑ TX</p>
          <p className="text-sm font-bold font-mono text-indigo-400">{formatBytesPerSec(totalTx)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            formatter={(v) => [formatBytesPerSec(v)]}
            labelFormatter={() => ''}
          />
          <Area type="monotone" dataKey="rx" stroke="#22c55e" strokeWidth={2} fill="url(#rxGrad)" dot={false} isAnimationActive={false} name="RX" />
          <Area type="monotone" dataKey="tx" stroke="#6366f1" strokeWidth={2} fill="url(#txGrad)" dot={false} isAnimationActive={false} name="TX" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Per-interface breakdown */}
      {ifaces.length > 0 && (
        <div className="mt-2 space-y-1">
          {ifaces.map(iface => (
            <div key={iface} className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-mono">{iface}</span>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-mono">{formatBytesPerSec(latest[iface]?.rxBytesPerSec || 0)}</span>
                <span className="text-indigo-400 font-mono">{formatBytesPerSec(latest[iface]?.txBytesPerSec || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
