import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContainerLogsModal({ container, logs, onClose, onRefresh }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const lines = (logs || '').split('\n')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-4xl max-h-[80vh] bg-gray-950 border border-gray-800 rounded-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-200">{container.name}</p>
                <p className="text-xs text-gray-500">{container.image}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Log output */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {!logs ? (
              <div className="flex items-center justify-center h-24 gap-2 text-gray-500">
                <div className="w-4 h-4 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Loading logs...
              </div>
            ) : lines.length === 0 ? (
              <p className="text-gray-600">(no output)</p>
            ) : (
              lines.map((line, i) => {
                const isError = /\berr(or)?\b/i.test(line) || line.includes('FATAL') || line.includes('CRIT')
                const isWarn = /warn/i.test(line)
                return (
                  <div
                    key={i}
                    className={`py-0.5 px-1 rounded whitespace-pre-wrap break-all ${
                      isError ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    {line}
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
