import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    // Forward the derived key if present (used for credential decryption)
    req.derivedKey = req.headers['x-derived-key'] || null
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
