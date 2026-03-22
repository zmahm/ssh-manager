import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto'

const PBKDF2_ITERATIONS = 310000
const PBKDF2_KEYLEN = 32
const PBKDF2_DIGEST = 'sha256'
const IV_LENGTH = 12  // GCM standard
const AUTH_TAG_LENGTH = 16

export function generateSalt() {
  return randomBytes(32).toString('hex')
}

export function deriveKey(password, saltHex) {
  const salt = Buffer.from(saltHex, 'hex')
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
}

export function encryptCredential(plainObj, keyHex) {
  const key = Buffer.from(keyHex, 'hex')
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = JSON.stringify(plainObj)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.')
}

export function decryptCredential(encryptedStr, keyHex) {
  const key = Buffer.from(keyHex, 'hex')
  const [ivB64, tagB64, ctB64] = encryptedStr.split('.')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}
