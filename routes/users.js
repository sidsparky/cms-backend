const express        = require('express')
const bcrypt         = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')
const requireRole    = require('../middleware/roleMiddleware')

const router = express.Router()

const store = require('../store')

// All user routes — SparksLab only
router.use(authMiddleware)
router.use(requireRole('sparkslab'))

// GET /api/store.users
router.get('/', (req, res) => {
  const safe = store.users.map(({ password, ...u }) => u)
  res.json({ success: true, message: 'Users retrieved successfully', data: { users: safe } })
})

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, role } = req.body
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'name, email and role are required', code: 400 })
  }
  const exists = store.users.find(u => u.email === email)
  if (exists) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists', code: 400 })
  }
  // TODO: Send invite email with password setup link
  const newUser = { id: uuidv4(), name, email, role, lastLogin: null }
  store.users.push(newUser)
  res.status(201).json({ success: true, message: 'User created and invite sent', data: newUser })
})

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const user = store.users.find(u => u.id === req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found', code: 404 })
  const { name, role } = req.body
  const updated = { ...user, name: name || user.name, role: role || user.role }
  store.users = store.users.map(u => u.id === req.params.id ? updated : u)
  const { password, ...safe } = updated
  res.json({ success: true, message: 'User updated successfully', data: safe })
})

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const exists = store.users.find(u => u.id === req.params.id)
  if (!exists) return res.status(404).json({ success: false, message: 'User not found', code: 404 })
  store.users = store.users.filter(u => u.id !== req.params.id)
  res.json({ success: true, message: 'User access revoked' })
})

module.exports = router