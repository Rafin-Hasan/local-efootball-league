import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { TopNav } from "@/components/shell/TopNav";
import { StandingsTables } from "@/components/standings/StandingsTables";
import { PageHeader, PageShell, StatTile } from "@/components/ui/Page";
import { getSession } from "@/lib/auth/session";
import { withRatings } from "@/lib/engine/ratings";
import { getLeagueOverview } from "@/lib/queries";

export const metadata: Metadata = { title: "Standings" };

export default async function StandingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getLeagueOverview(session.tournamentId);
  if (!data) redirect("/api/auth/signout?reason=stale");

  // Keep the standings order (points → GD → GF → h2h) and attach ratings.
  const rated = withRatings(data.standings);

  const me =
    session.role === "player"
      ? data.players.find((p) => p.id === session.playerId)
      : undefined;
  const myClub = me ? (me.clubName ?? "").trim() || me.name : null;

  const leader = rated[0];
  const topScorer = data.goldenBoot[0];

  return (
    <>
      <TopNav session={session} />
      <PageShell>
        <PageHeader
          eyebrow="Live table"
          title="Standings"
          lead="Recalculated from every played 1v1 on each load — nothing here is cached. Ties break on goal difference, then goals scored, then head-to-head."
        />

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Leader"
            value={
              <span className="block truncate text-2xl">
                {leader?.points ? leader.name : "—"}
              </span>
            }
            sub={leader?.points ? `${leader.points} pts` : "No matches played"}
            accent="gold"
          />
          <StatTile
            label="Top scorer"
            value={
              <span className="block truncate text-2xl">
                {topScorer?.goalsFor ? topScorer.name : "—"}
              </span>
            }
            sub={
              topScorer?.goalsFor ? `${topScorer.goalsFor} goals` : "No goals yet"
            }
            accent="aqua"
          />
          <StatTile label="Players" value={data.playerCount} />
          <StatTile
            label="Matches played"
            value={data.playedCount}
            sub={`of ${data.matchCount}`}
            accent="win"
          />
        </div>

        <Reveal>
        <StandingsTables
          players={rated}
          clubs={data.clubRace}
          highlightPlayer={
            session.role === "player" ? session.playerId : undefined
          }
          highlightClub={myClub}
        />
        </Reveal>
      </PageShell>
    </>
  );
}
