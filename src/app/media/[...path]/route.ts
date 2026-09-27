import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { uploadDir } from '@/lib/media'

// Serves local uploads (dev, or prod without S3). Next only serves public/ files present at build time.
const TYPES: Record<string, string> = { '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' }

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path
  const root = path.resolve(uploadDir())
  const file = path.resolve(root, 'media', ...parts)
  const type = TYPES[path.extname(file)]
  if (!file.startsWith(root + path.sep) || !type) return new Response('Not found', { status: 404 })

  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) return new Response('Not found', { status: 404 })
  const headers: Record<string, string> = { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes' }

  // Range support: Safari refuses to play <video> without it
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '')
  if (m && (m[1] || m[2])) {
    const start = m[1] ? Number(m[1]) : Math.max(0, info.size - Number(m[2]))
    const end = m[1] && m[2] ? Math.min(Number(m[2]), info.size - 1) : info.size - 1
    if (start > end || start >= info.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } })
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
    return new Response(stream, { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': String(end - start + 1) } })
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream
  return new Response(stream, { headers: { ...headers, 'Content-Length': String(info.size) } })
}
