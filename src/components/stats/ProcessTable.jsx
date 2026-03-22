export default function ProcessTable({ processes }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Top Processes</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800">
              <th className="text-left pb-2 font-medium w-14">PID</th>
              <th className="text-left pb-2 font-medium w-20">User</th>
              <th className="text-right pb-2 font-medium w-16">CPU%</th>
              <th className="text-right pb-2 font-medium w-16">MEM%</th>
              <th className="text-left pb-2 font-medium pl-4">Command</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, i) => (
              <tr
                key={`${p.pid}-${i}`}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-1.5 font-mono text-gray-500">{p.pid}</td>
                <td className="py-1.5 text-gray-400 truncate max-w-[5rem]">{p.user}</td>
                <td className="py-1.5 text-right font-mono">
                  <span className={p.cpuPct > 50 ? 'text-red-400' : p.cpuPct > 20 ? 'text-yellow-400' : 'text-gray-300'}>
                    {p.cpuPct.toFixed(1)}
                  </span>
                </td>
                <td className="py-1.5 text-right font-mono text-gray-300">{p.memPct.toFixed(1)}</td>
                <td className="py-1.5 pl-4 text-gray-300 font-mono truncate max-w-[200px]">{p.cmd}</td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-600">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
