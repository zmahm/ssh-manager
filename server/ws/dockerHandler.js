import db from '../db/database.js'
import { decryptCredential } from '../services/crypto.js'
import { connectForStats, execCommand } from '../services/sshManager.js'

const CHECK_CMD = `docker info --format '{{.ServerVersion}}' 2>/dev/null || echo '__DOCKER_NA__'`

const POLL_CMD = [
  `docker ps -a --no-trunc --format '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}"}'`,
  `echo '---PS_END---'`,
  `timeout 8 docker stats --no-stream --no-trunc --format '{"id":"{{.ID}}","cpu":"{{.CPUPerc}}","memUsage":"{{.MemUsage}}","memPerc":"{{.MemPerc}}","netIO":"{{.NetIO}}","blockIO":"{{.BlockIO}}"}' 2>/dev/null`,
  `echo '---STATS_END---'`,
].join('; ')

function parseDockerPoll(stdout) {
  const [psRaw = '', rest = ''] = stdout.split('---PS_END---')
  const [statsRaw = ''] = rest.split('---STATS_END---')

  const containers = psRaw.trim().split('\n').filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)] } catch { return [] }
  })

  const statsMap = {}
  statsRaw.trim().split('\n').filter(Boolean).forEach(line => {
    try {
      const s = JSON.parse(line)
      statsMap[s.id] = {
        cpu: parseFloat(s.cpu) || 0,
        memUsage: s.memUsage || '0B / 0B',
        memPct: parseFloat(s.memPerc) || 0,
        netIO: s.netIO || '0B / 0B',
        blockIO: s.blockIO || '0B / 0B',
      }
    } catch {}
  })

  return { containers, statsMap }
}

export function handleDocker(ws, derivedKey) {
  let conn = null
  let pollTimer = null
  let polling = false

  ws.on('message', async (data) => {
    let msg
    try { msg = JSON.parse(data.toString()) } catch { return }

    if (msg.type === 'connect') {
      await handleConnect(msg, derivedKey || msg.key)
    } else if (msg.type === 'set_interval' && conn) {
      restartPoll(msg.interval || 3000)
    } else if (msg.type === 'action' && conn) {
      await handleAction(msg)
    } else if (msg.type === 'get_logs' && conn) {
      await handleLogs(msg)
    } else if (msg.type === 'disconnect') {
      cleanup()
    }
  })

  ws.on('close', cleanup)

  async function handleConnect(msg, key) {
    const { profileId, interval = 3000 } = msg

    const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId)
    if (!row) { send(ws, { type: 'error', message: 'Profile not found' }); return }

    let credential = null
    if (row.encrypted_credential && key) {
      try { credential = decryptCredential(row.encrypted_credential, key) } catch {
        send(ws, { type: 'error', message: 'Failed to decrypt credentials' }); return
      }
    }

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

      const { stdout: checkOut } = await execCommand(conn, CHECK_CMD)
      const version = checkOut.trim()
      if (version === '__DOCKER_NA__' || !version) {
        send(ws, { type: 'docker_unavailable' })
        return
      }

      send(ws, { type: 'ready', dockerVersion: version })
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
        const { stdout } = await execCommand(conn, POLL_CMD)
        const { containers, statsMap } = parseDockerPoll(stdout)
        send(ws, { type: 'docker_data', containers, statsMap, ts: Date.now() })
      } catch (err) {
        send(ws, { type: 'error', message: err.message })
      }
    }
    tick()
    pollTimer = setInterval(tick, interval)
  }

  function restartPoll(interval) {
    clearInterval(pollTimer)
    polling = false
    startPoll(interval)
  }

  async function handleAction(msg) {
    const { containerId, action } = msg
    const cmds = {
      start: `docker start ${containerId}`,
      stop: `docker stop ${containerId}`,
      restart: `docker restart ${containerId}`,
      remove: `docker rm -f ${containerId}`,
    }
    const cmd = cmds[action]
    if (!cmd) return
    try {
      await execCommand(conn, cmd)
      send(ws, { type: 'action_result', action, containerId, ok: true })
    } catch (err) {
      send(ws, { type: 'action_result', action, containerId, ok: false, error: err.message })
    }
  }

  async function handleLogs(msg) {
    const { containerId, tail = 200 } = msg
    try {
      const { stdout, stderr } = await execCommand(conn,
        `docker logs --tail ${tail} --timestamps ${containerId} 2>&1`)
      send(ws, { type: 'container_logs', containerId, logs: stdout })
    } catch (err) {
      send(ws, { type: 'container_logs', containerId, logs: `Error fetching logs: ${err.message}` })
    }
  }

  function cleanup() {
    clearInterval(pollTimer)
    polling = false
    try { conn?.end() } catch {}
    conn = null
  }
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
}
