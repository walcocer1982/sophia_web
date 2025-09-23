import NextAuth, { type NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' }, // usa tus tablas Session/Account/User
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // expone el rol en el cliente
      if (session.user) (session.user as any).role = (user as any).role
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers: {GET, POST}, auth, signIn, signOut } = NextAuth(authConfig)
