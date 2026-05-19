require('dotenv').config()

const express        = require('express')
const cors           = require('cors')
const helmet         = require('helmet')
const rateLimit      = require('express-rate-limit')
const path           = require('path')

const authRouter      = require('./routes/auth')
const analyticsRouter = require('./routes/analytics')
const videosRouter    = require('./routes/videos')
const questionsRouter = require('./routes/questions')
const contentRouter   = require('./routes/content')
const responsesRouter = require('./routes/responses')
const trackingRouter  = require('./routes/tracking')
const usersRouter     = require('./routes/users')
const slidesRouter    = require('./routes/slides')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet())

// ── Analytics ─────────────────────────────────────────────────────────────
app.use('/analytics', analyticsRouter)

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}))

// app.use(cors({
//   origin: [
//     'https://onboard.adnec.ae',
//     'https://cms.adnec.ae',
//   ],
//   credentials: true,
// }))

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Rate limiting on login ────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      10,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait a minute.',
    code:    429,
  },
})
app.use('/auth/login', loginLimiter)

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/auth',          authRouter)
app.use('/api/videos',    videosRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/content',   contentRouter)
app.use('/api/responses', responsesRouter)
app.use('/api/tracking',  trackingRouter)
app.use('/api/users',     usersRouter)
app.use('/api/slides',    slidesRouter)

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', code: 404 })
})

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large', code: 400 })
  }
  res.status(500).json({ success: false, message: err.message || 'Server error', code: 500 })
})

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  CMS Backend running at http://localhost:${PORT}\n`)
  console.log(`   Health check: http://localhost:${PORT}/health`)
  console.log(`   Environment:  ${process.env.NODE_ENV}\n`)
})