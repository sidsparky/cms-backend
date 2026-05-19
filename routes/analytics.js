const express        = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const store          = require('../store')

const router = express.Router()

// GET /analytics/stats
router.get('/stats', authMiddleware, (req, res) => {
  const linksOpened       = store.events.length
  const surveySubmissions = store.responses.length
  const journeysCompleted = store.responses.length // same for now

  res.json({
    success: true,
    message: 'Stats retrieved successfully',
    data: {
      linksOpened,
      journeysCompleted,
      surveySubmissions,
    }
  })
})

module.exports = router