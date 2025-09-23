import { NextResponse } from 'next/server'
import { authEdge } from '@/lib/auth-edge'

export default authEdge((req) => {
  const pathname = req.nextUrl.pathname
  const token = req.auth

  // Si está en /lessons y no está autenticado, redirigir a home
  if (pathname.startsWith('/lessons') && !token) {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

// Solo proteger las rutas de lessons
export const config = {
  matcher: ['/lessons/:path*'],
}