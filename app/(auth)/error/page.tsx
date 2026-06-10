import Link from "next/link"

interface ErrorPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams

  const errorMessages: Record<string, string> = {
    access_denied: "You cancelled the login. Try again when you're ready.",
    Configuration: "There's a server configuration issue. Contact support.",
    Default: "Something went wrong. Please try again.",
  }

  const message = error
    ? (errorMessages[error] ?? errorMessages.Default)
    : errorMessages.Default

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-4 text-xl font-bold text-white">
          Authentication Error
        </h1>
        <p className="mt-2 text-gray-400">{message}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Login
        </Link>
      </div>
    </main>
  )
}