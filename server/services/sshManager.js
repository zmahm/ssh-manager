import { Client } from 'ssh2'

/**
 * Connect to an SSH server, optionally through a jump host.
 * Returns a promise resolving to { conn, stream } where:
 *   conn   — the ssh2 Client (or the outermost Client if jump host)
 *   stream — a PTY shell stream
 *
 * profileConfig shape:
 * {
 *   host, port, username,
 *   authType: 'password' | 'key' | 'agent',
 *   credential: { password } | { privateKey, passphrase },
 *   jumpHostConfig: null | { host, port, username, authType, credential },
 *   keepaliveInterval, connectionTimeout,
 *   envVars: { KEY: VALUE },
 *   portForwards: [{ type: 'local'|'remote'|'dynamic', localPort, remoteHost, remotePort }]
 * }
 */
export function connectSSH(profileConfig) {
  return new Promise((resolve, reject) => {
    if (profileConfig.jumpHostConfig) {
      connectViaJump(profileConfig, resolve, reject)
    } else {
      connectDirect(profileConfig, null, resolve, reject)
    }
  })
}

function buildConnectConfig(cfg) {
  const base = {
    host: cfg.host,
    port: cfg.port || 22,
    username: cfg.username,
    readyTimeout: cfg.connectionTimeout || 15000,
    keepaliveInterval: cfg.keepaliveInterval || 10000,
  }

  if (cfg.authType === 'password') {
    base.password = cfg.credential?.password
  } else if (cfg.authType === 'key') {
    base.privateKey = cfg.credential?.privateKey
    if (cfg.credential?.passphrase) {
      base.passphrase = cfg.credential.passphrase
    }
  } else if (cfg.authType === 'agent') {
    // Try OpenSSH agent socket; fall back gracefully
    base.agent = process.env.SSH_AUTH_SOCK || (process.platform === 'win32' ? '\\\\.\\pipe\\openssh-ssh-agent' : undefined)
    if (!base.agent) {
      return { error: 'No SSH agent socket available' }
    }
  }
  return base
}

function connectDirect(cfg, socket, resolve, reject) {
  const conn = new Client()
  const connConfig = buildConnectConfig(cfg)

  if (connConfig.error) {
    return reject(new Error(connConfig.error))
  }

  if (socket) {
    connConfig.sock = socket
  }

  conn.on('ready', () => {
    // Set up port forwards if requested
    setupPortForwards(conn, cfg.portForwards || [])

    conn.shell({ term: 'xterm-256color', rows: 24, cols: 80 }, (err, stream) => {
      if (err) {
        conn.end()
        return reject(err)
      }

      // Set environment variables via shell if any
      const envVars = cfg.envVars || {}
      const envExports = Object.entries(envVars)
        .map(([k, v]) => `export ${k}=${JSON.stringify(v)}`)
        .join('; ')
      if (envExports) {
        stream.write(envExports + '\n')
      }

      resolve({ conn, stream })
    })
  })

  conn.on('error', reject)
  conn.connect(connConfig)
}

function connectViaJump(cfg, resolve, reject) {
  const jumpConn = new Client()
  const jumpConfig = buildConnectConfig(cfg.jumpHostConfig)

  if (jumpConfig.error) {
    return reject(new Error(jumpConfig.error))
  }

  jumpConn.on('ready', () => {
    jumpConn.forwardOut(
      '127.0.0.1', 0,
      cfg.host, cfg.port || 22,
      (err, stream) => {
        if (err) {
          jumpConn.end()
          return reject(err)
        }
        // Connect target through the stream (socket)
        const innerConn = new Client()
        const innerConfig = buildConnectConfig(cfg)
        innerConfig.sock = stream

        innerConn.on('ready', () => {
          setupPortForwards(innerConn, cfg.portForwards || [])
          innerConn.shell({ term: 'xterm-256color', rows: 24, cols: 80 }, (err2, shellStream) => {
            if (err2) {
              innerConn.end()
              jumpConn.end()
              return reject(err2)
            }
            const envVars = cfg.envVars || {}
            const envExports = Object.entries(envVars)
              .map(([k, v]) => `export ${k}=${JSON.stringify(v)}`)
              .join('; ')
            if (envExports) shellStream.write(envExports + '\n')

            // When inner conn ends, also clean up jump
            innerConn.on('end', () => jumpConn.end())
            resolve({ conn: innerConn, stream: shellStream, jumpConn })
          })
        })

        innerConn.on('error', (err3) => {
          jumpConn.end()
          reject(err3)
        })
        innerConn.connect(innerConfig)
      }
    )
  })

  jumpConn.on('error', reject)
  jumpConn.connect(jumpConfig)
}

function setupPortForwards(conn, portForwards) {
  for (const pf of portForwards) {
    if (pf.type === 'remote') {
      conn.forwardIn(pf.remoteHost || '0.0.0.0', pf.remotePort, (err) => {
        if (err) console.error('Port forward error:', err.message)
      })
    }
    // Local forwards are handled client-side via the WS tunnel
    // Dynamic (SOCKS) is out of scope for v1
  }
}

/**
 * Open a non-shell exec channel for running a single command (used by stats).
 */
export function execCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err)
      let stdout = ''
      let stderr = ''
      stream.on('data', (d) => { stdout += d })
      stream.stderr.on('data', (d) => { stderr += d })
      stream.on('close', () => resolve({ stdout, stderr }))
    })
  })
}

/**
 * Connect without a shell — just returns the conn for exec-based stats.
 */
export function connectForStats(profileConfig) {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const connConfig = buildConnectConfig(profileConfig)
    if (connConfig.error) return reject(new Error(connConfig.error))

    conn.on('ready', () => resolve(conn))
    conn.on('error', reject)
    conn.connect(connConfig)
  })
}
