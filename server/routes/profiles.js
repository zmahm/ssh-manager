import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database.js'
import { encryptCredential, decryptCredential } from '../services/crypto.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

function serializeProfile(row) {
  return {
    id: row.id,
    label: row.label,
    host: row.host,
    port: row.port,
    username: row.username,
    authType: row.auth_type,
    jumpHostId: row.jump_host_id,
    portForwards: JSON.parse(row.port_forwards || '[]'),
    envVars: JSON.parse(row.env_vars || '{}'),
    keepaliveInterval: row.keepalive_interval,
    connectionTimeout: row.connection_timeout,
    tags: JSON.parse(row.tags || '[]'),
    color: row.color,
    lastConnected: row.last_connected,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// GET /api/profiles
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY label ASC').all()
  res.json(rows.map(serializeProfile))
})

// GET /api/profiles/:id — includes decrypted credentials
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Profile not found' })

  const profile = serializeProfile(row)
  if (row.encrypted_credential && req.derivedKey) {
    try {
      profile.credential = decryptCredential(row.encrypted_credential, req.derivedKey)
    } catch {
      profile.credential = null
    }
  }
  res.json(profile)
})

// POST /api/profiles
router.post('/', (req, res) => {
  const {
    label, host, port = 22, username, authType,
    credential, jumpHostId, portForwards = [], envVars = {},
    keepaliveInterval = 10000, connectionTimeout = 15000,
    tags = [], color = '#6366f1',
  } = req.body

  if (!label || !host || !username || !authType) {
    return res.status(400).json({ error: 'label, host, username, authType are required' })
  }

  let encryptedCredential = null
  if (credential && req.derivedKey) {
    encryptedCredential = encryptCredential(credential, req.derivedKey)
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO profiles
      (id, label, host, port, username, auth_type, encrypted_credential,
       jump_host_id, port_forwards, env_vars, keepalive_interval,
       connection_timeout, tags, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, label, host, port, username, authType, encryptedCredential,
    jumpHostId || null, JSON.stringify(portForwards), JSON.stringify(envVars),
    keepaliveInterval, connectionTimeout, JSON.stringify(tags), color
  )

  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)
  res.status(201).json(serializeProfile(row))
})

// PUT /api/profiles/:id
router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Profile not found' })

  const {
    label, host, port, username, authType,
    credential, jumpHostId, portForwards, envVars,
    keepaliveInterval, connectionTimeout, tags, color,
  } = req.body

  let encryptedCredential = row.encrypted_credential
  if (credential !== undefined && req.derivedKey) {
    encryptedCredential = credential ? encryptCredential(credential, req.derivedKey) : null
  }

  db.prepare(`
    UPDATE profiles SET
      label = ?, host = ?, port = ?, username = ?, auth_type = ?,
      encrypted_credential = ?, jump_host_id = ?, port_forwards = ?,
      env_vars = ?, keepalive_interval = ?, connection_timeout = ?,
      tags = ?, color = ?, updated_at = unixepoch()
    WHERE id = ?
  `).run(
    label ?? row.label,
    host ?? row.host,
    port ?? row.port,
    username ?? row.username,
    authType ?? row.auth_type,
    encryptedCredential,
    jumpHostId !== undefined ? jumpHostId : row.jump_host_id,
    portForwards ? JSON.stringify(portForwards) : row.port_forwards,
    envVars ? JSON.stringify(envVars) : row.env_vars,
    keepaliveInterval ?? row.keepalive_interval,
    connectionTimeout ?? row.connection_timeout,
    tags ? JSON.stringify(tags) : row.tags,
    color ?? row.color,
    req.params.id
  )

  const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id)
  res.json(serializeProfile(updated))
})

// DELETE /api/profiles/:id
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT id FROM profiles WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Profile not found' })
  db.prepare('DELETE FROM profiles WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// PATCH /api/profiles/:id/last-connected
router.patch('/:id/last-connected', requireAuth, (req, res) => {
  db.prepare('UPDATE profiles SET last_connected = unixepoch() WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
