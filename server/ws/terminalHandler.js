import db from '../db/database.js'
import { decryptCredential } from '../services/crypto.js'
import { connectSSH } from '../services/sshManager.js'
import { setSession, getSession, deleteSession } from '../services/sessionStore.js'

export function handleTerminal(ws, derivedKey) {
  let sessionData = null

  ws.on('message', async (data) => {
    // Binary frames are raw terminal data
    if (data instanceof Buffer && sessionData?.stream) {
      sessionData.stream.write(data)
      return
    }

    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch {
      return
    }

    if (msg.type === 'connect') {
      await handleConnect(ws, msg, derivedKey || msg.key)
    } else if (msg.type === 'resize' && sessionData?.stream) {
      const { cols, rows } = msg
      sessionData.stream.setWindow(rows, cols, 0, 0)
    } else if (msg.type === 'disconnect') {
      cleanup(msg.sessionId)
    }
  })

  ws.on('close', () => {
    if (sessionData) cleanup(sessionData.sessionId)
  })

  async function handleConnect(ws, msg, key) {
    const { profileId, sessionId, cols = 80, rows = 24 } = msg

    const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId)
    if (!row) {
      send(ws, { type: 'error', message: 'Profile not found' })
      return
    }

    let credential = null
    if (row.encrypted_credential && key) {
      try {
        credential = decryptCredential(row.encrypted_credential, key)
      } catch {
        send(ws, { type: 'error', message: 'Failed to decrypt credentials' })
        return
      }
    }

    // Resolve jump host if needed
    let jumpHostConfig = null
    if (row.jump_host_id) {
      const jumpRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.jump_host_id)
      if (jumpRow) {
        let jumpCredential = null
        if (jumpRow.encrypted_credential && key) {
          try { jumpCredential = decryptCredential(jumpRow.encrypted_credential, key) } catch {}
        }
        jumpHostConfig = {
          host: jumpRow.host, port: jumpRow.port, username: jumpRow.username,
          authType: jumpRow.auth_type, credential: jumpCredential,
        }
      }
    }

    const profileConfig = {
      host: row.host, port: row.port, username: row.username,
      authType: row.auth_type, credential,
      keepaliveInterval: row.keepalive_interval,
      connectionTimeout: row.connection_timeout,
      envVars: JSON.parse(row.env_vars || '{}'),
      portForwards: JSON.parse(row.port_forwards || '[]'),
      jumpHostConfig,
    }

    send(ws, { type: 'connecting' })

    try {
      const { conn, stream, jumpConn } = await connectSSH(profileConfig)

      // Resize to requested dimensions
      stream.setWindow(rows, cols, 0, 0)

      sessionData = { sessionId, conn, stream, jumpConn }
      setSession(sessionId, sessionData)

      // Update last_connected
      db.prepare('UPDATE profiles SET last_connected = unixepoch() WHERE id = ?').run(profileId)

      send(ws, { type: 'ready' })

      // Pipe SSH output to WebSocket as binary
      stream.on('data', (chunk) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(chunk, { binary: true })
        }
      })

      stream.on('close', () => {
        send(ws, { type: 'closed' })
        cleanup(sessionId)
      })

      conn.on('error', (err) => {
        send(ws, { type: 'error', message: err.message })
        cleanup(sessionId)
      })
    } catch (err) {
      send(ws, { type: 'error', message: err.message })
    }
  }

  function cleanup(sessionId) {
    const s = sessionId ? getSession(sessionId) : sessionData
    if (!s) return
    try { s.stream?.end() } catch {}
    try { s.conn?.end() } catch {}
    try { s.jumpConn?.end() } catch {}
    if (sessionId) deleteSession(sessionId)
    sessionData = null
  }
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(obj))
  }
}
