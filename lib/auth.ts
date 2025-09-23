import NextAuth, { type NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // Cambiar a JWT para compatibilidad con Edge
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Primera vez que el usuario inicia sesión
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        }
      }
      return token
    },
    async session({ session, token }) {
      // Exponer el rol y id en el cliente
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
} satisfies NextAuthConfig

export const { handlers: {GET, POST}, auth, signIn, signOut } = NextAuth(authConfig)
