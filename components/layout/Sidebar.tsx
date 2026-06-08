"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

// TypeScript — define the shape of the user prop
interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// Navigation items — easy to add more later
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "⊞" },
  { label: "Meetings", href: "/meetings", icon: "📋" },
  { label: "Tasks", href: "/tasks", icon: "✓" },
  { label: "Team", href: "/team", icon: "👥" },
]

export default function Sidebar({ user }: SidebarProps) {
  // usePathname — tells us the current URL path
  // Used to highlight the active nav item
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-900">
      {/* Logo */}
      <div className="border-b border-gray-800 p-6">
        <h1 className="text-lg font-bold text-white">AI Meeting</h1>
        <p className="text-xs text-gray-500">Manager</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          // Is this the current page?
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          {user.image && (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}