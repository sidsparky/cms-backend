const express    = require('express')
const jwt        = require('jsonwebtoken')
const bcrypt     = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')
const requireRole    = require('../middleware/roleMiddleware')

const router = express.Router()

// Mock users DB — replace with real DB queries
const USERS = [
  {
    id:       'usr-001',
    name:     'SparksLab Admin',
    email:    'admin@sparkslab.ae',
    password: bcrypt.hashSync('admin123', 10),
    role:     'sparkslab',
  },
  {
    id:       'usr-002',
    name:     'HR Manager',
    email:    'hr@adnec.ae',
    password: bcrypt.hashSync('client123', 10),
    role:     'client',
  },
]

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code:    400,
      })
    }

    const user = USERS.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code:    401,
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code:    401,
      })
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', code: 500 })
  }
})

// POST /auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  // JWT is stateless — client just deletes the token
  res.json({ success: true, message: 'Logged out successfully' })
})

// POST /auth/refresh
router.post('/refresh', authMiddleware, (req, res) => {
  try {
    const { id, name, email, role } = req.user
    const token = jwt.sign(
      { id, name, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
    res.json({
      success: true,
      message: 'Token refreshed',
      data: { token },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', code: 500 })
  }
})

// POST /auth/validate — employee onboarding token validation
router.post('/validate', (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
        code:    400,
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        employeeId:   decoded.employeeId,
        employeeName: decoded.employeeName,
        email:        decoded.email,
        department:   decoded.department,
      },
    })
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired onboarding link',
      code:    401,
    })
  }
})

// POST /auth/generate-token — single employee link
router.post('/generate-token',
  (req, res, next) => {
    // API key check
    const apiKey = req.headers['x-api-key']
    if (apiKey !== process.env.CLIENT_API_KEY) {
      return res.status(401).json({ success: false, message: 'Invalid API key', code: 401 })
    }
    next()
  },
  (req, res) => {
    try {
      const { employeeId, employeeName, email, department, expiresIn } = req.body

      if (!employeeId || !employeeName || !email || !department) {
        return res.status(400).json({
          success: false,
          message: 'employeeId, employeeName, email and department are required',
          code:    400,
        })
      }

      const token = jwt.sign(
        { employeeId, employeeName, email, department },
        process.env.JWT_SECRET,
        { expiresIn: expiresIn || '7d' }
      )

      const decoded       = jwt.decode(token)
      const expiresAt     = new Date(decoded.exp * 1000).toISOString()
      const onboardingUrl = `${process.env.APP_URL}/onboard?token=${token}`

      res.json({
        success: true,
        message: 'Token generated successfully',
        data: { token, onboardingUrl, expiresAt },
      })
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', code: 500 })
    }
  }
)

// POST /auth/generate-tokens — bulk employee links
router.post('/generate-tokens',
  (req, res, next) => {
    const apiKey = req.headers['x-api-key']
    if (apiKey !== process.env.CLIENT_API_KEY) {
      return res.status(401).json({ success: false, message: 'Invalid API key', code: 401 })
    }
    next()
  },
  (req, res) => {
    try {
      const { employees, expiresIn } = req.body

      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Employees array is required',
          code:    400,
        })
      }

      const links = employees.map(emp => {
        const token = jwt.sign(
          {
            employeeId:   emp.employeeId,
            employeeName: emp.employeeName,
            email:        emp.email,
            department:   emp.department,
          },
          process.env.JWT_SECRET,
          { expiresIn: expiresIn || '7d' }
        )

        const decoded       = jwt.decode(token)
        const expiresAt     = new Date(decoded.exp * 1000).toISOString()
        const onboardingUrl = `${process.env.APP_URL}/onboard?token=${token}`

        return {
          employeeId:   emp.employeeId,
          employeeName: emp.employeeName,
          email:        emp.email,
          department:   emp.department,
          onboardingUrl,
          expiresAt,
          status:       'not_opened',
        }
      })

      res.json({
        success: true,
        message: 'Links generated successfully',
        data: {
          total:       links.length,
          generatedAt: new Date().toISOString(),
          links,
        },
      })
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', code: 500 })
    }
  }
)

module.exports = router