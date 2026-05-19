const express  = require('express')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

let questions = [
  { id: 'q1', order: 1, question: 'What drew you to joining ADNEC?',                             type: 'text',            required: true  },
  { id: 'q2', order: 2, question: 'How would you describe your work style?',                      type: 'multiple_choice', options: ['Independent', 'Collaborative', 'Flexible', 'Structured'], required: true },
  { id: 'q3', order: 3, question: 'How comfortable are you with remote/hybrid work?',             type: 'scale',           required: true  },
  { id: 'q4', order: 4, question: 'What are you most excited to achieve in your first 90 days?', type: 'text',            required: false },
]

// GET /api/questions
router.get('/', (req, res) => {
  const sorted = [...questions].sort((a, b) => a.order - b.order)
  res.json({ success: true, message: 'Questions retrieved successfully', data: { questions: sorted } })
})

// GET /api/questions/:id
router.get('/:id', (req, res) => {
  const q = questions.find(q => q.id === req.params.id)
  if (!q) return res.status(404).json({ success: false, message: 'Question not found', code: 404 })
  res.json({ success: true, message: 'Question retrieved successfully', data: q })
})

// POST /api/questions
router.post('/', authMiddleware, (req, res) => {
  const { question, type, options, required } = req.body
  if (!question || !type) {
    return res.status(400).json({ success: false, message: 'question and type are required', code: 400 })
  }
  const newQ = {
    id:       uuidv4(),
    order:    questions.length + 1,
    question,
    type,
    options:  type === 'multiple_choice' ? (options || []) : undefined,
    required: required !== undefined ? required : true,
  }
  questions.push(newQ)
  res.status(201).json({ success: true, message: 'Question created successfully', data: { id: newQ.id, order: newQ.order } })
})

// PUT /api/questions/reorder
router.put('/reorder', authMiddleware, (req, res) => {
  const { order } = req.body
  if (!order || !Array.isArray(order)) {
    return res.status(400).json({ success: false, message: 'order array is required', code: 400 })
  }
  order.forEach((id, index) => {
    const q = questions.find(q => q.id === id)
    if (q) q.order = index + 1
  })
  res.json({ success: true, message: 'Question order updated successfully' })
})

// PUT /api/questions/:id
router.put('/:id', authMiddleware, (req, res) => {
  const q = questions.find(q => q.id === req.params.id)
  if (!q) return res.status(404).json({ success: false, message: 'Question not found', code: 404 })
  const { question, type, options, required } = req.body
  const updated = {
    ...q,
    question: question !== undefined ? question : q.question,
    type:     type     !== undefined ? type     : q.type,
    options:  type === 'multiple_choice' ? (options || q.options) : undefined,
    required: required !== undefined ? required : q.required,
  }
  questions = questions.map(item => item.id === req.params.id ? updated : item)
  res.json({ success: true, message: 'Question updated successfully', data: updated })
})

// DELETE /api/questions/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const exists = questions.find(q => q.id === req.params.id)
  if (!exists) return res.status(404).json({ success: false, message: 'Question not found', code: 404 })
  questions = questions.filter(q => q.id !== req.params.id)
  res.json({ success: true, message: 'Question deleted successfully' })
})

module.exports = router