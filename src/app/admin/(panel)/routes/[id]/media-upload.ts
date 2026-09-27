export interface UploadedMedia {
  url: string
  kind: 'image' | 'video'
}

/** POST a file to /admin/media. XHR, not fetch: videos are big and the admin needs upload progress. */
export function uploadMedia(file: File, onProgress?: (share: number) => void): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/admin/media')
    xhr.responseType = 'json'
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      const body = xhr.response as { url?: string; kind?: UploadedMedia['kind']; error?: string } | null
      if (xhr.status === 200 && body?.url && body.kind) resolve({ url: body.url, kind: body.kind })
      else if (xhr.status === 413) reject(new Error('Файл завеликий для сервера.'))
      else reject(new Error(body?.error ?? `Не вдалося завантажити файл (код ${xhr.status}).`))
    }
    xhr.onerror = () => reject(new Error('Немає звʼязку з сервером. Перевірте інтернет і спробуйте ще раз.'))
    const fd = new FormData()
    fd.append('file', file)
    xhr.send(fd)
  })
}
