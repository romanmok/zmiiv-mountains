import 'server-only'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

// Uploaded photos/videos for route pages.
// Storage: Contabo S3 when S3_BUCKET + keys are set (prod), otherwise local UPLOAD_DIR served by /media/[...path] (dev).

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }

export interface StoredMedia {
  kind: 'image' | 'video'
  storage: 's3' | 'local'
  storage_key: string
  url: string
  mime: string
  bytes: number
  width: number | null
  height: number | null
}

export class MediaError extends Error {}

export const uploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

let s3: S3Client | null = null
function s3Config() {
  const { S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env
  if (!S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) return null
  const endpoint = process.env.S3_ENDPOINT || 'https://eu2.contabostorage.com'
  s3 ??= new S3Client({
    endpoint,
    region: process.env.S3_REGION || 'eu-central-1',
    forcePathStyle: true,
    credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
  })
  // Contabo public URLs need the tenant prefix: https://eu2.contabostorage.com/<tenant>:<bucket>/<key>
  const publicBase = (process.env.S3_PUBLIC_BASE || `${endpoint}/${S3_BUCKET}/`).replace(/\/?$/, '/')
  return { client: s3, bucket: S3_BUCKET, prefix: process.env.S3_PREFIX ?? 'zmiiv-mountains/', publicBase }
}

async function put(key: string, body: Buffer, mime: string): Promise<Pick<StoredMedia, 'storage' | 'storage_key' | 'url'>> {
  const cfg = s3Config()
  if (cfg) {
    const fullKey = cfg.prefix + key
    await cfg.client.send(
      new PutObjectCommand({ Bucket: cfg.bucket, Key: fullKey, Body: body, ContentType: mime, CacheControl: 'public, max-age=31536000, immutable' }),
    )
    return { storage: 's3', storage_key: fullKey, url: cfg.publicBase + key }
  }
  const file = path.join(uploadDir(), key)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, body)
  return { storage: 'local', storage_key: key, url: `/${key}` }
}

const newKey = (ext: string) => {
  const d = new Date()
  return `media/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${randomBytes(8).toString('hex')}.${ext}`
}

/** Photos are re-encoded to WebP ≤1920px (phone shots are 5–10 MB); videos are stored as is. */
export async function storeMedia(file: File): Promise<StoredMedia> {
  const buf = Buffer.from(await file.arrayBuffer())

  if (file.type.startsWith('video/')) {
    const ext = VIDEO_TYPES[file.type]
    if (!ext) throw new MediaError('Відео має бути у форматі MP4, WebM або MOV.')
    if (buf.length > MAX_VIDEO_BYTES) throw new MediaError('Відео більше 200 МБ. Стисніть його або завантажте на YouTube і вставте посилання.')
    const stored = await put(newKey(ext), buf, file.type)
    return { ...stored, kind: 'video', mime: file.type, bytes: buf.length, width: null, height: null }
  }

  if (!file.type.startsWith('image/')) throw new MediaError('Можна завантажити лише фото або відео.')
  if (buf.length > MAX_IMAGE_BYTES) throw new MediaError('Фото більше 25 МБ.')
  let out
  try {
    out = await sharp(buf, { animated: file.type === 'image/gif' })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
  } catch {
    throw new MediaError('Не вдалося прочитати фото. Збережіть його як JPEG або PNG і спробуйте ще раз.')
  }
  const stored = await put(newKey('webp'), out.data, 'image/webp')
  return { ...stored, kind: 'image', mime: 'image/webp', bytes: out.data.length, width: out.info.width, height: out.info.pageHeight ?? out.info.height }
}
