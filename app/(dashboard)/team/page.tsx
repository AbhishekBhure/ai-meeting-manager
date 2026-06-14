import { getMyTeam } from "@/actions/team"
import CreateTeamForm from "@/components/team/CreateTeamForm"
import TeamDashboard from "@/components/team/TeamDashboard"

export default async function TeamPage() {
  const team = await getMyTeam()

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-2xl font-bold text-white">Team</h1>

        {team ? (
          <TeamDashboard team={team} />
        ) : (
          <CreateTeamForm />
        )}
      </div>
    </div>
  )
}