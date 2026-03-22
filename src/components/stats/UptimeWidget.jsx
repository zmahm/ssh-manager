import { formatUptime } from '../../utils/formatUptime'

export default function UptimeWidget({ uptime, loadAvg }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">System</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Uptime</span>
          <span className="text-sm font-mono font-bold text-gray-200">{formatUptime(uptime)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Load (1m)</span>
          <span className={`text-sm font-mono font-bold ${(loadAvg[0] || 0) > 2 ? 'text-red-400' : 'text-gray-200'}`}>
            {(loadAvg[0] || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Load (5m)</span>
          <span className="text-sm font-mono text-gray-400">{(loadAvg[1] || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Load (15m)</span>
          <span className="text-sm font-mono text-gray-400">{(loadAvg[2] || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
