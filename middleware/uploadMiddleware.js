const multer = require('multer')
const path   = require('path')

// Store files in memory so we can upload to CDN
const storage = multer.memoryStorage()

function fileFilter(allowedTypes) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`))
    }
  }
}

// Video upload — MP4 and WebM only, max 500MB
const videoUpload = multer({
  storage,
  limits:     { fileSize: 500 * 1024 * 1024 },
  fileFilter: fileFilter(['.mp4', '.webm']),
})

// Image upload — JPG and PNG only, max 10MB
const imageUpload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png']),
})

// Audio upload — MP3 only, max 20MB
const audioUpload = multer({
  storage,
  limits:     { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilter(['.mp3']),
})

// Mixed — for slides with both images and audio
const mixedUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
})

module.exports = { videoUpload, imageUpload, audioUpload, mixedUpload }