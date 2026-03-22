import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function DiskWidget({ buffer }) {
  const latest = buffer[buffer.length - 1] || {}
  // Exclude the 'ts' timestamp key — only keep actual device names
  const devices = Object.keys(latest).filter(k => k !== 'ts')

  const chartData = buffer.map((p, i) => {
    const entry = { i }
    for (const dev of devices) {
      entry[`${dev}_r`] = p[dev]?.readsPerSec ?? 0
      entry[`${dev}_w`] = p[dev]?.writesPerSec ?? 0
    }
    return entry
  })

  const colors = ['#6366f1', '#22c55e', '#f97316', '#ec4899']

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Disk I/O (ops/sec)</p>

      {/* Latest values */}
      <div className="flex gap-4 mb-3 flex-wrap">
        {devices.map((dev, i) => (
          <div key={dev} className="text-xs">
            <span className="text-gray-500">{dev} </span>
            <span className="font-mono" style={{ color: colors[i % colors.length] }}>
              R: {latest[dev]?.readsPerSec || 0}
            </span>
            <span className="text-gray-600"> / </span>
            <span className="font-mono text-orange-400">
              W: {latest[dev]?.writesPerSec || 0}
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="i" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            labelFormatter={() => ''}
          />
          {devices.flatMap((dev, i) => [
            <Line key={`${dev}_r`} type="monotone" dataKey={`${dev}_r`}
              stroke={colors[i % colors.length]} strokeWidth={1.5} dot={false}
              isAnimationActive={false} name={`${dev} read`} />,
            <Line key={`${dev}_w`} type="monotone" dataKey={`${dev}_w`}
              stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="3 2"
              isAnimationActive={false} name={`${dev} write`} />,
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
