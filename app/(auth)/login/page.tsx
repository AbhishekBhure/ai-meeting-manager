import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginButton from "@/components/auth/LoginButton"

export default async function LoginPage() {
  // If user is already logged in, send them to dashboard
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            AI Meeting Manager
          </h1>
          <p className="mt-2 text-gray-400">
            Sign in to manage your meetings
          </p>
        </div>

        {/* Login Button */}
        <LoginButton />

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          By signing in, you agree to our terms of service
        </p>
      </div>
    </main>
  )
}