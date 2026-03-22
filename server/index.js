import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import authRouter from './routes/auth.js'
import profilesRouter from './routes/profiles.js'
import { errorHandler } from './middleware/errorHandler.js'
import { setupWebSocketServer } from './ws/wsServer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'https://sshmanager.zeshanmahmood.com',
]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

app.use('/api/auth', authRouter)
app.use('/api/profiles', profilesRouter)

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }))

// Serve React frontend static files (production)
const distPath = join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))

app.use(errorHandler)

const server = createServer(app)
setupWebSocketServer(server)

server.listen(PORT, () => {
  console.log(`SSH Manager server running on port ${PORT}`)
})
