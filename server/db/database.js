import Database from 'better-sqlite3'
import { readFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_PATH = process.env.DB_PATH || './data/sshapp.db'

// Ensure data directory exists
const dbDir = dirname(DB_PATH)
mkdirSync(dbDir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Run all migrations in order
const migrationsDir = join(__dirname, 'migrations')
const migrations = [
  '001_create_users.sql',
  '002_create_profiles.sql',
  '003_create_sessions.sql',
]

for (const file of migrations) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  db.exec(sql)
}

export default db
