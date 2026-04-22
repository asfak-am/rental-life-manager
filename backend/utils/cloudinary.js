const { v2: cloudinary } = require('cloudinary')

const isConfigured = () => (
  Boolean(process.env.CLOUDINARY_CLOUD_NAME)
  && Boolean(process.env.CLOUDINARY_API_KEY)
  && Boolean(process.env.CLOUDINARY_API_SECRET)
)

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

const uploadBase64Image = async (dataUri, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured')
  }

  return cloudinary.uploader.upload(dataUri, {
    folder: 'rental-life/avatars',
    resource_type: 'image',
    transformation: [
      { width: 512, height: 512, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    ...options,
  })
}

const deleteImage = async (publicId) => {
  if (!publicId || !isConfigured()) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  } catch {
    // Ignore destroy errors to avoid blocking profile updates.
  }
}

module.exports = {
  isCloudinaryConfigured: isConfigured,
  uploadBase64Image,
  deleteImage,
}
