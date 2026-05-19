const express  = require('express')
const { v4: uuidv4 } = require('uuid')
const authMiddleware = require('../middleware/authMiddleware')
const { videoUpload } = require('../middleware/uploadMiddleware')

const router = express.Router()

// Mock DB — replace with real DB queries
let videos = [
  { id: 'vid-001', title: 'Background Loop',    screenId: 'screen-1', layer: 'background', url: 'https://cdn.adnec.ae/videos/bg-loop-screen1.mp4',   loop: true,  muted: true,  active: true },
  { id: 'vid-002', title: 'Welcome Content',    screenId: 'screen-1', layer: 'content',    url: 'https://cdn.adnec.ae/videos/welcome-content.mp4',    loop: false, muted: false, active: true },
  { id: 'vid-003', title: 'Background Loop',    screenId: 'screen-2', layer: 'background', url: 'https://cdn.adnec.ae/videos/bg-loop-screen2.mp4',   loop: true,  muted: true,  active: true },
  { id: 'vid-004', title: 'Corporate Overview', screenId: 'screen-2', layer: 'content',    url: 'https://cdn.adnec.ae/videos/corporate-overview.mp4', loop: false, muted: false, active: true },
  { id: 'vid-005', title: 'Background Loop',    screenId: 'screen-3', layer: 'background', url: 'https://cdn.adnec.ae/videos/bg-loop-screen3.mp4',   loop: true,  muted: true,  active: true },
  { id: 'vid-006', title: 'Leadership Message', screenId: 'screen-3', layer: 'content',    url: 'https://cdn.adnec.ae/videos/leadership-message.mp4', loop: false, muted: false, active: true },
]

// GET /api/videos
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Videos retrieved successfully',
    data:    { videos },
  })
})

// GET /api/videos/:id
router.get('/:id', authMiddleware, (req, res) => {
  const video = videos.find(v => v.id === req.params.id)
  if (!video) {
    return res.status(404).json({ success: false, message: 'Video not found', code: 404 })
  }
  res.json({ success: true, message: 'Video retrieved successfully', data: video })
})

// POST /api/videos
router.post('/', authMiddleware, videoUpload.single('file'), async (req, res) => {
  try {
    const { title, screenId, layer, loop, muted, active } = req.body

    if (!title || !screenId || !layer) {
      return res.status(400).json({
        success: false,
        message: 'title, screenId and layer are required',
        code:    400,
      })
    }

    // TODO: Upload req.file.buffer to CDN and get back a URL
    // const url = await uploadToCDN(req.file.buffer, req.file.originalname)
    const url = `${process.env.CDN_BASE_URL}/videos/${Date.now()}-${req.file?.originalname || 'video.mp4'}`

    const newVideo = {
      id:       uuidv4(),
      title,
      screenId,
      layer,
      url,
      loop:     loop === 'true' || loop === true,
      muted:    muted === 'true' || muted === true,
      active:   active === 'true' || active === true,
    }

    videos.push(newVideo)

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data:    newVideo,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed', code: 500 })
  }
})

// PUT /api/videos/reorder
router.put('/reorder', authMiddleware, (req, res) => {
  const { order } = req.body
  if (!order || !Array.isArray(order)) {
    return res.status(400).json({ success: false, message: 'order array is required', code: 400 })
  }
  res.json({ success: true, message: 'Video order updated successfully' })
})

// PUT /api/videos/:id
router.put('/:id', authMiddleware, videoUpload.single('file'), async (req, res) => {
  try {
    const video = videos.find(v => v.id === req.params.id)
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found', code: 404 })
    }

    const { title, active, loop, muted } = req.body
    let url = video.url

    if (req.file) {
      // TODO: Upload new file to CDN
      // url = await uploadToCDN(req.file.buffer, req.file.originalname)
      url = `${process.env.CDN_BASE_URL}/videos/${Date.now()}-${req.file.originalname}`
    }

    const updated = {
      ...video,
      title:  title  !== undefined ? title  : video.title,
      active: active !== undefined ? (active === 'true' || active === true) : video.active,
      loop:   loop   !== undefined ? (loop   === 'true' || loop   === true) : video.loop,
      muted:  muted  !== undefined ? (muted  === 'true' || muted  === true) : video.muted,
      url,
    }

    videos = videos.map(v => v.id === req.params.id ? updated : v)

    res.json({ success: true, message: 'Video updated successfully', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed', code: 500 })
  }
})

// DELETE /api/videos/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const exists = videos.find(v => v.id === req.params.id)
  if (!exists) {
    return res.status(404).json({ success: false, message: 'Video not found', code: 404 })
  }
  // TODO: Also delete file from CDN
  videos = videos.filter(v => v.id !== req.params.id)
  res.json({ success: true, message: 'Video deleted successfully' })
})

module.exports = router