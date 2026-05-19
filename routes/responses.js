const express        = require('express')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const store = require('../store')

// POST /api/responses
router.post('/', (req, res) => {
  const { employeeId, employeeName, email, department, answers, submittedAt } = req.body
  if (!employeeId || !answers) {
    return res.status(400).json({ success: false, message: 'employeeId and answers are required', code: 400 })
  }
  const newResponse = {
    id: uuidv4(), employeeId, employeeName, email,
    department, answers, submittedAt: submittedAt || new Date().toISOString(),
  }
  store.responses.push(newResponse)
  res.status(201).json({ success: true, message: 'Survey responses saved successfully' })
})

// GET /api/responses
router.get('/', authMiddleware, (req, res) => {
  const { department, from, to, search } = req.query
  let filtered = [...store.responses]
  if (department) filtered = filtered.filter(r => r.department === department)
  if (from)       filtered = filtered.filter(r => new Date(r.submittedAt) >= new Date(from))
  if (to)         filtered = filtered.filter(r => new Date(r.submittedAt) <= new Date(to))
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(r =>
      r.employeeName?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s)
    )
  }
  res.json({ success: true, message: 'Responses retrieved successfully', data: { total: filtered.length, responses: filtered } })
})

// GET /api/responses/export
router.get('/export', authMiddleware, (req, res) => {
  const { department } = req.query
  let filtered = [...store.responses]
  if (department) filtered = filtered.filter(r => r.department === department)
  const allKeys = [...new Set(filtered.flatMap(r => Object.keys(r.answers || {})))]
  const header  = ['id', 'employeeId', 'employeeName', 'email', 'department', 'submittedAt', ...allKeys].join(',')
  const rows    = filtered.map(r => [
    r.id, r.employeeId, r.employeeName, r.email,
    r.department, r.submittedAt,
    ...allKeys.map(k => `"${String(r.answers?.[k] || '').replace(/"/g, '""')}"`)
  ].join(','))
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"')
  res.send([header, ...rows].join('\n'))
})

// GET /api/responses/:id
router.get('/:id', authMiddleware, (req, res) => {
  const r = store.responses.find(r => r.id === req.params.id)
  if (!r) return res.status(404).json({ success: false, message: 'Response not found', code: 404 })
  res.json({ success: true, message: 'Response retrieved successfully', data: r })
})

module.exports = router