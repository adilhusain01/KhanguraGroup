import { v2 as cloudinary } from 'cloudinary'

function configured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
    throw new Error('Cloudinary is not configured.')
  return { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET }
}
export function privateUploadSignature(
  kind: 'inquiry' | 'application',
  resourceType: 'image' | 'raw',
) {
  const env = configured()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `${process.env.CLOUDINARY_PRIVATE_FOLDER ?? 'khangura-private'}/${kind}`
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, type: 'authenticated' },
    env.CLOUDINARY_API_SECRET,
  )
  return {
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder,
    type: 'authenticated' as const,
    resourceType,
  }
}
export function publicUploadSignature() {
  const env = configured()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = process.env.CLOUDINARY_PUBLIC_FOLDER ?? 'khangura-public'
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    env.CLOUDINARY_API_SECRET,
  )
  return {
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder,
  }
}

export async function destroyPrivateAsset(
  publicId: string,
  resourceType: 'image' | 'raw' = 'raw',
) {
  const env = configured()
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    invalidate: true,
  })
}

export function privateDeliveryUrl(
  publicId: string,
  resourceType: 'image' | 'raw' = 'raw',
) {
  const env = configured()
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'authenticated',
    resource_type: resourceType,
  })
}
