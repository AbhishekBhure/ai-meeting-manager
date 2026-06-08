import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) redirect("/login")

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">
          Welcome, {session.user.name}! 👋
        </h1>
        <p className="mt-2 text-gray-400">{session.user.email}</p>
        <p className="mt-4 text-green-400">✅ Login working!</p>
      </div>
    </main>
  )
}