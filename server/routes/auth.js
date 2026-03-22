import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database.js'
import { generateSalt, deriveKey } from '../services/crypto.js'

const router = Router()

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' })
}

function signRefresh() {
  return uuidv4() + '-' + uuidv4()
}

// GET /api/auth/status — check if app has been set up
router.get('/status', (req, res) => {
  const user = db.prepare('SELECT id FROM users LIMIT 1').get()
  res.json({ isSetup: !!user })
})

// POST /api/auth/setup — first-run master password creation
router.post('/setup', async (req, res) => {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get()
  if (existing) {
    return res.status(400).json({ error: 'App already configured' })
  }
  const { password } = req.body
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  const salt = generateSalt()
  const passwordHash = await bcrypt.hash(password, 12)
  db.prepare('INSERT INTO users (password_hash, salt) VALUES (?, ?)').run(passwordHash, salt)

  // Derive key and return it so the frontend can store it in memory
  const derivedKey = deriveKey(password, salt).toString('hex')
  const accessToken = signAccess({ userId: 1 })
  const refreshToken = signRefresh()
  const refreshHash = await bcrypt.hash(refreshToken, 8)
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  db.prepare('INSERT INTO refresh_tokens (id, token_hash, expires_at) VALUES (?, ?, ?)').run(uuidv4(), refreshHash, expiresAt)

  res.json({ accessToken, refreshToken, derivedKey })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })

  const user = db.prepare('SELECT * FROM users LIMIT 1').get()
  if (!user) return res.status(400).json({ error: 'App not configured' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid password' })

  const derivedKey = deriveKey(password, user.salt).toString('hex')
  const accessToken = signAccess({ userId: user.id })
  const refreshToken = signRefresh()
  const refreshHash = await bcrypt.hash(refreshToken, 8)
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60

  // Clean up expired tokens
  db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(Math.floor(Date.now() / 1000))
  db.prepare('INSERT INTO refresh_tokens (id, token_hash, expires_at) VALUES (?, ?, ?)').run(uuidv4(), refreshHash, expiresAt)

  res.json({ accessToken, refreshToken, derivedKey })
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

  const tokens = db.prepare('SELECT * FROM refresh_tokens WHERE expires_at > ?').all(Math.floor(Date.now() / 1000))
  let matched = null
  for (const t of tokens) {
    if (await bcrypt.compare(refreshToken, t.token_hash)) {
      matched = t
      break
    }
  }
  if (!matched) return res.status(401).json({ error: 'Invalid refresh token' })

  // Rotate: delete old, issue new
  db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(matched.id)
  const newRefresh = signRefresh()
  const refreshHash = await bcrypt.hash(newRefresh, 8)
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  db.prepare('INSERT INTO refresh_tokens (id, token_hash, expires_at) VALUES (?, ?, ?)').run(uuidv4(), refreshHash, expiresAt)

  const accessToken = signAccess({ userId: 1 })
  res.json({ accessToken, refreshToken: newRefresh })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Client should discard tokens; optionally invalidate all refresh tokens
  db.prepare('DELETE FROM refresh_tokens').run()
  res.json({ ok: true })
})

export default router
