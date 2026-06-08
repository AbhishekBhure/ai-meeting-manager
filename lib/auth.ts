import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./prisma"

// Full auth config — used in API routes and server components
// Has Prisma adapter, saves users to database
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    // Use JWT strategy so middleware can verify without hitting database
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // jwt callback runs when token is created or updated
    // We store user id inside the token
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // session callback runs when session is checked
    // We pull id from token into session
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})