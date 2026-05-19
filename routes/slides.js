const express        = require('express')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')
const { mixedUpload } = require('../middleware/uploadMiddleware')

const router = express.Router()

let slides = [
  {
    id: 'slide-001', department: 'Technology', order: 1,
    title: 'Welcome to Technology',
    body: 'Here is what your first week looks like.',
    subtitleText: 'Use the arrows to navigate',
    buttonLabel: 'Next', buttonAction: 'next_slide',
    images: [{ id: 'img-001', url: '', caption: 'Our Technology Hub', order: 1 }],
    audio:  [{ id: 'aud-001', url: '', label: 'Introduction', order: 1 }],
  },
  {
    id: 'slide-002', department: 'Technology', order: 2,
    title: 'Your Team', body: 'Here are the people you will be working with.',
    subtitleText: null, buttonLabel: 'Next', buttonAction: 'next_slide',
    images: [], audio: [],
  },
  {
    id: 'slide-003', department: 'Finance', order: 1,
    title: 'Welcome to Finance', body: 'Overview of the Finance department.',
    subtitleText: 'Use the arrows to navigate', buttonLabel: 'Next', buttonAction: 'next_slide',
    images: [], audio: [],
  },
]

// GET /api/slides — all slides
router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Slides retrieved successfully', data: { slides } })
})

// GET /api/slides/:department
router.get('/:department', (req, res) => {
  const deptSlides = slides
    .filter(s => s.department === req.params.department)
    .sort((a, b) => a.order - b.order)
  res.json({
    success: true, message: 'Slides retrieved successfully',
    data: { department: req.params.department, slides: deptSlides },
  })
})

// POST /api/slides
router.post('/', authMiddleware, mixedUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio',  maxCount: 10 },
]), (req, res) => {
  try {
    const { department, title, body, subtitleText, buttonLabel, buttonAction, order } = req.body
    if (!department || !title || !body) {
      return res.status(400).json({ success: false, message: 'department, title and body are required', code: 400 })
    }

    // TODO: Upload image and audio files to CDN
    const images = (req.files?.images || []).map((file, i) => ({
      id:      uuidv4(),
      url:     `${process.env.CDN_BASE_URL}/slides/${Date.now()}-${file.originalname}`,
      caption: null,
      order:   i + 1,
    }))
    const audio = (req.files?.audio || []).map((file, i) => ({
      id:    uuidv4(),
      url:   `${process.env.CDN_BASE_URL}/audio/${Date.now()}-${file.originalname}`,
      label: null,
      order: i + 1,
    }))

    const newSlide = {
      id: uuidv4(), department, order: parseInt(order) || slides.length + 1,
      title, body, subtitleText: subtitleText || null,
      buttonLabel: buttonLabel || 'Next',
      buttonAction: buttonAction || 'next_slide',
      images, audio,
    }
    slides.push(newSlide)
    res.status(201).json({ success: true, message: 'Slide created successfully', data: newSlide })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create slide', code: 500 })
  }
})

// PUT /api/slides/:id
router.put('/:id', authMiddleware, mixedUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio',  maxCount: 10 },
]), (req, res) => {
  try {
    const slide = slides.find(s => s.id === req.params.id)
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found', code: 404 })

    const { title, body, subtitleText, buttonLabel, buttonAction } = req.body

    const newImages = (req.files?.images || []).map((file, i) => ({
      id: uuidv4(), url: `${process.env.CDN_BASE_URL}/slides/${Date.now()}-${file.originalname}`,
      caption: null, order: slide.images.length + i + 1,
    }))
    const newAudio = (req.files?.audio || []).map((file, i) => ({
      id: uuidv4(), url: `${process.env.CDN_BASE_URL}/audio/${Date.now()}-${file.originalname}`,
      label: null, order: slide.audio.length + i + 1,
    }))

    const updated = {
      ...slide,
      title:        title        || slide.title,
      body:         body         || slide.body,
      subtitleText: subtitleText !== undefined ? subtitleText : slide.subtitleText,
      buttonLabel:  buttonLabel  || slide.buttonLabel,
      buttonAction: buttonAction || slide.buttonAction,
      images: newImages.length > 0 ? [...slide.images, ...newImages] : slide.images,
      audio:  newAudio.length  > 0 ? [...slide.audio,  ...newAudio]  : slide.audio,
    }
    slides = slides.map(s => s.id === req.params.id ? updated : s)
    res.json({ success: true, message: 'Slide updated successfully', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update slide', code: 500 })
  }
})

// DELETE /api/slides/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const exists = slides.find(s => s.id === req.params.id)
  if (!exists) return res.status(404).json({ success: false, message: 'Slide not found', code: 404 })
  // TODO: Delete associated images and audio from CDN
  slides = slides.filter(s => s.id !== req.params.id)
  res.json({ success: true, message: 'Slide deleted successfully' })
})

module.exports = router