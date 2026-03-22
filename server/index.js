import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import authRouter from './routes/auth.js'
import profilesRouter from './routes/profiles.js'
import { errorHandler } from './middleware/errorHandler.js'
import { setupWebSocketServer } from './ws/wsServer.js'

const app = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
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

app.use(errorHandler)

const server = createServer(app)
setupWebSocketServer(server)

server.listen(PORT, () => {
  console.log(`SSH Manager server running on port ${PORT}`)
})
