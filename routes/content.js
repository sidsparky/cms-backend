const express        = require('express')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

let content = [
  { screenId: 'screen-1', eyebrow: 'Day one starts here',  heading: 'Welcome to ADNEC',          subtitle: "We're glad you're here.", skipLabel: 'Skip video', continueLabel: 'Continue' },
  { screenId: 'screen-2', eyebrow: 'Our story',            heading: 'About ADNEC',                subtitle: 'Learn about who we are.',  skipLabel: 'Skip video', continueLabel: 'Continue' },
  { screenId: 'screen-3', eyebrow: 'A message for you',    heading: 'From Our Leadership',        subtitle: 'Hear directly from our leaders.', skipLabel: 'Skip video', continueLabel: 'Continue' },
  { screenId: 'screen-4', eyebrow: 'Your department',      heading: 'Your Journey Starts Here',   subtitle: 'Explore what your role looks like.', nextLabel: 'Next', backLabel: 'Back' },
  { screenId: 'screen-5', eyebrow: 'Onboarding survey',    heading: 'Welcome Aboard',             subtitle: "We'd love to get to know you better", submitLabel: 'Submit responses' },
  { screenId: 'screen-6', eyebrow: 'All done',             heading: "You're all set!",            message: 'Thank you for completing your onboarding.', nextSteps: 'Your manager will be in touch shortly.' },
]

// GET /api/content
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Content retrieved successfully', data: { content } })
})

// PUT /api/content
router.put('/', authMiddleware, (req, res) => {
  const { screenId, ...fields } = req.body
  if (!screenId) {
    return res.status(400).json({ success: false, message: 'screenId is required', code: 400 })
  }
  const screen = content.find(c => c.screenId === screenId)
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found', code: 404 })
  }
  const updated = { ...screen, ...fields }
  content = content.map(c => c.screenId === screenId ? updated : c)
  res.json({ success: true, message: 'Content updated successfully', data: updated })
})

module.exports = router