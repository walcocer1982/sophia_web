export { auth as middleware } from '@/lib/auth'

// Protege todo /lessons/*
export const config = {
  matcher: ['/lessons/:path*'],
}