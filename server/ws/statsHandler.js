import db from '../db/database.js'
import { decryptCredential } from '../services/crypto.js'
import { connectForStats, execCommand } from '../services/sshManager.js'
import { STATS_COMMAND, parseStats, clearSample } from '../services/statsCollector.js'

export function handleStats(ws, derivedKey) {
  let conn = null
  let pollTimer = null
  let sessionId = null
  let polling = false

  ws.on('message', async (data) => {
    let msg
    try { msg = JSON.parse(data.toString()) } catch { return }

    if (msg.type === 'connect') {
      await handleConnect(msg, derivedKey || msg.key)
    } else if (msg.type === 'set_interval' && pollTimer) {
      restartPoll(msg.interval || 2000)
    } else if (msg.type === 'disconnect') {
      cleanup()
    }
  })

  ws.on('close', cleanup)

  async function handleConnect(msg, key) {
    const { profileId, interval = 2000 } = msg
    sessionId = profileId + '_stats_' + Date.now()

    const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId)
    if (!row) { send(ws, { type: 'error', message: 'Profile not found' }); return }

    let credential = null
    if (row.encrypted_credential && key) {
      try { credential = decryptCredential(row.encrypted_credential, key) } catch {
        send(ws, { type: 'error', message: 'Failed to decrypt credentials' }); return
      }
    }

    // Resolve jump host
    let jumpHostConfig = null
    if (row.jump_host_id) {
      const jRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.jump_host_id)
      if (jRow) {
        let jCred = null
        if (jRow.encrypted_credential && key) {
          try { jCred = decryptCredential(jRow.encrypted_credential, key) } catch {}
        }
        jumpHostConfig = {
          host: jRow.host, port: jRow.port, username: jRow.username,
          authType: jRow.auth_type, credential: jCred,
        }
      }
    }

    const profileConfig = {
      host: row.host, port: row.port, username: row.username,
      authType: row.auth_type, credential,
      keepaliveInterval: row.keepalive_interval,
      connectionTimeout: row.connection_timeout,
      jumpHostConfig,
    }

    send(ws, { type: 'connecting' })

    try {
      conn = await connectForStats(profileConfig)
      conn.on('error', (err) => { send(ws, { type: 'error', message: err.message }); cleanup() })
      conn.on('end', cleanup)

      send(ws, { type: 'ready' })
      startPoll(interval)
    } catch (err) {
      send(ws, { type: 'error', message: err.message })
    }
  }

  function startPoll(interval) {
    if (polling) return
    polling = true
    const tick = async () => {
      if (!conn || ws.readyState !== ws.OPEN) return
      try {
        const { stdout } = await execCommand(conn, STATS_COMMAND)
        const stats = parseStats(stdout, sessionId)
        if (stats.unsupported) {
          send(ws, { type: 'stats_unsupported', platform: stats.platform })
          clearInterval(pollTimer)
          polling = false
          return
        }
        send(ws, stats)
      } catch (err) {
        send(ws, { type: 'error', message: err.message })
      }
    }
    tick() // immediate first tick
    pollTimer = setInterval(tick, interval)
  }

  function restartPoll(interval) {
    clearInterval(pollTimer)
    polling = false
    startPoll(interval)
  }

  function cleanup() {
    clearInterval(pollTimer)
    polling = false
    if (sessionId) clearSample(sessionId)
    try { conn?.end() } catch {}
    conn = null
  }
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
}
