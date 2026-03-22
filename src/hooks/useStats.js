import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

const MAX_POINTS = 60

const emptyBuffer = () => ({
  cpu: [], memory: [], disk: [], network: [], gpu: [],
  uptime: 0, processes: [], loadAvg: [0, 0, 0],
  status: 'idle', platform: null,
})

export function useStats(tab) {
  const [buffer, setBuffer] = useState(emptyBuffer())
  const [interval, setIntervalMs] = useState(2000)

  const { sendJSON } = useWebSocket({
    path: `/ws/stats`,
    enabled: !!tab,
    onOpen: () => {
      sendJSON({ type: 'connect', profileId: tab.profileId, interval })
      setBuffer(b => ({ ...b, status: 'connecting' }))
    },
    onMessage: (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'ready') {
        setBuffer(b => ({ ...b, status: 'connected' }))
      } else if (msg.type === 'stats') {
        setBuffer(prev => {
          const push = (arr, val) => [...arr, val].slice(-MAX_POINTS)
          return {
            ...prev,
            status: 'connected',
            cpu: push(prev.cpu, { ts: msg.timestamp, cores: msg.cpu.cores }),
            memory: push(prev.memory, { ts: msg.timestamp, ...msg.memory }),
            disk: push(prev.disk, { ts: msg.timestamp, ...msg.disk }),
            network: push(prev.network, { ts: msg.timestamp, ...msg.network }),
            gpu: msg.gpu || [],
            uptime: msg.uptime,
            processes: msg.processes || [],
            loadAvg: msg.cpu.loadAvg || [0, 0, 0],
          }
        })
      } else if (msg.type === 'stats_unsupported') {
        setBuffer(b => ({ ...b, status: 'unsupported', platform: msg.platform }))
      } else if (msg.type === 'error') {
        setBuffer(b => ({ ...b, status: 'error' }))
      } else if (msg.type === 'connecting') {
        setBuffer(b => ({ ...b, status: 'connecting' }))
      }
    },
    onClose: () => setBuffer(b => ({ ...b, status: 'closed' })),
  })

  const changeInterval = useCallback((ms) => {
    setIntervalMs(ms)
    sendJSON({ type: 'set_interval', interval: ms })
  }, [sendJSON])

  return { buffer, changeInterval, intervalMs: interval }
}
