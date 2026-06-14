import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import JoinTeamButton from "@/components/team/JoinTeamButton"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params
  const session = await auth()

  if (!session) redirect(`/login?callbackUrl=/invite/${code}`)

  // Find the team with new schema
  const team = await prisma.team.findUnique({
    where: { inviteCode: code },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  })

  if (!team) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-4xl">❌</p>
          <h1 className="mt-4 text-xl font-bold text-white">
            Invalid Invite Link
          </h1>
          <p className="mt-2 text-gray-400">
            This invite link is invalid or has expired.
          </p>
        </div>
      </main>
    )
  }

  // Check if already a member using new TeamMember table
  const isMember = team.members.some((m) => m.user.id === session.user.id)

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-4xl">👥</p>
        <h1 className="mt-4 text-xl font-bold text-white">
          Join {team.name}
        </h1>
        <p className="mt-2 text-gray-400">
          {team.members.length} member
          {team.members.length !== 1 ? "s" : ""} already in this team
        </p>

        {/* Member avatars */}
        <div className="my-6 flex justify-center -space-x-2">
          {team.members.slice(0, 5).map((member) =>
            member.user.image ? (
              <img
                key={member.id}
                src={member.user.image}
                alt={member.user.name ?? "Member"}
                className="h-10 w-10 rounded-full border-2 border-gray-900"
              />
            ) : (
              <div
                key={member.id}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-900 bg-gray-700 text-sm text-white"
              >
                {member.user.name?.[0] ?? "?"}
              </div>
            )
          )}
        </div>

        {isMember ? (
          <div>
            <p className="mb-4 text-green-400">
              ✓ You are already a member of this team
            </p>
            <a
              href="/team"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Go to Team
            </a>
          </div>
        ) : (
          <JoinTeamButton inviteCode={code} teamName={team.name} />
        )}
      </div>
    </main>
  )
}