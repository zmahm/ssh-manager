import { Gauge } from './StatCard'

export default function GpuWidget({ gpus }) {
  if (!gpus || gpus.length === 0) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">GPU</p>
      <div className="space-y-4">
        {gpus.map((gpu, i) => {
          const memPct = gpu.memTotalMb ? (gpu.memUsedMb / gpu.memTotalMb) * 100 : 0
          const tempColor = gpu.tempC > 80 ? '#ef4444' : gpu.tempC > 60 ? '#f97316' : '#22c55e'
          return (
            <div key={i} className="space-y-2">
              <p className="text-xs text-gray-400">GPU {gpu.index}</p>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-center gap-1">
                  <Gauge value={gpu.utilPct} color="#8b5cf6" size={56} />
                  <span className="text-xs font-mono text-purple-400">{gpu.utilPct}%</span>
                  <span className="text-xs text-gray-600">util</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Gauge value={memPct} color="#06b6d4" size={56} />
                  <span className="text-xs font-mono text-cyan-400">{memPct.toFixed(0)}%</span>
                  <span className="text-xs text-gray-600">mem</span>
                </div>
                <div className="text-xs space-y-1.5 flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mem Used</span>
                    <span className="font-mono text-gray-300">{gpu.memUsedMb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mem Total</span>
                    <span className="font-mono text-gray-300">{gpu.memTotalMb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Temp</span>
                    <span className="font-mono font-bold" style={{ color: tempColor }}>{gpu.tempC}°C</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
