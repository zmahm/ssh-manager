import { WebSocketServer } from 'ws'
import { parse } from 'url'
import jwt from 'jsonwebtoken'
import { handleTerminal } from './terminalHandler.js'
import { handleStats } from './statsHandler.js'

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const { pathname, query } = parse(req.url, true)

    // Verify JWT from query param or Authorization header
    const token = query.token || (req.headers['authorization'] || '').replace('Bearer ', '')
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    if (pathname === '/ws/terminal' || pathname === '/ws/stats') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, pathname)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', (ws, req, pathname) => {
    const { query } = parse(req.url, true)
    const derivedKey = query.key || null

    if (pathname === '/ws/terminal') {
      handleTerminal(ws, derivedKey)
    } else if (pathname === '/ws/stats') {
      handleStats(ws, derivedKey)
    }
  })

  return wss
}
