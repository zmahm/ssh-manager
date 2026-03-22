import { useEffect, useRef, useCallback } from 'react'
import { getWsBase } from '../utils/getBaseUrl'

export function useWebSocket({ path, onMessage, onOpen, onClose, onError, enabled = true }) {
  const wsRef = useRef(null)
  const handlersRef = useRef({ onMessage, onOpen, onClose, onError })

  useEffect(() => {
    handlersRef.current = { onMessage, onOpen, onClose, onError }
  })

  const connect = useCallback(() => {
    if (!enabled) return
    const token = sessionStorage.getItem('accessToken')
    const key = sessionStorage.getItem('derivedKey')
    const url = `${getWsBase()}${path}?token=${token || ''}&key=${key || ''}`
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => handlersRef.current.onOpen?.()
    ws.onmessage = (e) => handlersRef.current.onMessage?.(e)
    ws.onclose = (e) => handlersRef.current.onClose?.(e)
    ws.onerror = (e) => handlersRef.current.onError?.(e)

    wsRef.current = ws
    return ws
  }, [path, enabled])

  useEffect(() => {
    const ws = connect()
    return () => {
      ws?.close()
      wsRef.current = null
    }
  }, [connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  const sendJSON = useCallback((obj) => {
    send(JSON.stringify(obj))
  }, [send])

  return { send, sendJSON, wsRef }
}
