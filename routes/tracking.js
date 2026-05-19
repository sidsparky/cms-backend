const express        = require('express')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const store = require('../store')

// POST /api/tracking/link-opened
router.post('/link-opened', (req, res) => {
  const { employeeId, employeeName, email, department, token, timestamp } = req.body
  const event = {
    id: uuidv4(), employeeId, employeeName, email,
    department, token,
    timestamp: timestamp || new Date().toISOString(),
    status:    'opened',
  }
  store.events.push(event)
  console.log(`[LINK OPENED] ${event.timestamp} — ${employeeName} (${email})`)
  res.json({ success: true, message: 'Link open event recorded' })
})

// GET /api/tracking
router.get('/', authMiddleware, (req, res) => {
  const { department, search } = req.query
  let filtered = [...store.events]
  if (department) filtered = filtered.filter(e => e.department === department)
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(e =>
      e.employeeName?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s)
    )
  }
  res.json({ success: true, message: 'Tracking events retrieved successfully', data: { total: filtered.length, events: filtered } })
})

module.exports = router