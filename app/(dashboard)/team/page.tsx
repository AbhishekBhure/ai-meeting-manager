import { getMyTeam, getMyMembership } from "@/actions/team"
import CreateTeamForm from "@/components/team/CreateTeamForm"
import TeamDashboard from "@/components/team/TeamDashboard"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getMyMembership()

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-2xl font-bold text-white">Team</h1>

        {membership ? (
          <TeamDashboard
            team={membership.team}
            currentUserId={session.user.id}
            currentUserRole={membership.role}
          />
        ) : (
          <CreateTeamForm />
        )}
      </div>
    </div>
  )
}