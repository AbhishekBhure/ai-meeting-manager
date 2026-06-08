import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// Edge-compatible auth config — NO Prisma, NO database
// Only used in middleware to verify JWT tokens
// Middleware runs on Edge Runtime which can't use Prisma
export const { auth: authEdge } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
})