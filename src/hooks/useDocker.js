import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

const MAX_HISTORY = 40

const emptyState = () => ({
  status: 'idle',
  dockerVersion: null,
  containers: [],
  statsMap: {},
  statsHistory: {},
  logs: {},
})

export function useDocker(tab) {
  const [state, setState] = useState(emptyState())
  const [intervalMs, setIntervalMs] = useState(3000)

  const { sendJSON } = useWebSocket({
    path: '/ws/docker',
    enabled: !!tab,
    onOpen: () => {
      sendJSON({ type: 'connect', profileId: tab.profileId, interval: intervalMs })
      setState(s => ({ ...s, status: 'connecting' }))
    },
    onMessage: (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'connecting') {
        setState(s => ({ ...s, status: 'connecting' }))
      } else if (msg.type === 'ready') {
        setState(s => ({ ...s, status: 'ready', dockerVersion: msg.dockerVersion }))
      } else if (msg.type === 'docker_unavailable') {
        setState(s => ({ ...s, status: 'unavailable' }))
      } else if (msg.type === 'docker_data') {
        setState(s => {
          const newHistory = { ...s.statsHistory }
          Object.entries(msg.statsMap).forEach(([id, stats]) => {
            const prev = newHistory[id] || []
            newHistory[id] = [
              ...prev,
              { ts: msg.ts, cpuPct: stats.cpu, memPct: stats.memPct },
            ].slice(-MAX_HISTORY)
          })
          return {
            ...s,
            containers: msg.containers,
            statsMap: msg.statsMap,
            statsHistory: newHistory,
          }
        })
      } else if (msg.type === 'container_logs') {
        setState(s => ({ ...s, logs: { ...s.logs, [msg.containerId]: msg.logs } }))
      } else if (msg.type === 'action_result') {
        // nothing needed — next poll will reflect new state
      } else if (msg.type === 'error') {
        setState(s => ({ ...s, status: 'error' }))
      }
    },
    onClose: () => setState(s => ({ ...s, status: s.status === 'idle' ? 'idle' : 'closed' })),
  })

  const sendAction = useCallback((containerId, action) => {
    sendJSON({ type: 'action', containerId, action })
  }, [sendJSON])

  const getLogs = useCallback((containerId) => {
    sendJSON({ type: 'get_logs', containerId })
  }, [sendJSON])

  const changeInterval = useCallback((ms) => {
    setIntervalMs(ms)
    sendJSON({ type: 'set_interval', interval: ms })
  }, [sendJSON])

  return { state, sendAction, getLogs, changeInterval, intervalMs }
}
