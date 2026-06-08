import { authEdge } from "@/lib/auth-edge"
import { NextResponse } from "next/server"

export default authEdge((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/api/auth")

  // Allow public routes through freely
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}