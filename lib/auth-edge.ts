import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'

// Configuración mínima para Edge Runtime (sin Prisma Adapter)
// IMPORTANTE: No usar PrismaAdapter aquí para reducir el tamaño del bundle
const authConfigEdge: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt', // Edge runtime debe usar JWT, no database
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLessons = nextUrl.pathname.startsWith('/lessons')

      if (isOnLessons) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
}

export const { auth: authEdge } = NextAuth(authConfigEdge)