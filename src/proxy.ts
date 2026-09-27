import { NextResponse, type NextRequest } from 'next/server'

// Cheap gate: no session cookie → login page. The real check (DB lookup) runs in every admin page and action.
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next()
  if (!req.cookies.has('zm_session')) return NextResponse.redirect(new URL('/admin/login', req.url))
  return NextResponse.next()
}

// /admin/media (uploads) is excluded: the proxy buffers request bodies up to 10 MB, videos are bigger.
// The route handler checks the session itself.
export const config = { matcher: ['/admin', '/admin/((?!media$).*)'] }
