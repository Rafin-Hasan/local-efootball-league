import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  ClubSwitcher,
  ContributionChart,
  RosterList,
  TrendChart,
} from "@/components/dashboard/ClubHub";
import { TopNav } from "@/components/shell/TopNav";
import { EmptyState, PageHeader, PageShell, StatTile } from "@/components/ui/Page";
import { getSession } from "@/lib/auth/session";
import { isPlayed } from "@/lib/engine/standings";
import { pointsOf } from "@/lib/engine/scoring";
import { getClubHub } from "@/lib/queries";

export const metadata: Metadata = { title: "Team Hub" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { club?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const overviewOnly = await getClubHub(session.tournamentId, null);
  if (!overviewOnly) redirect("/api/auth/signout?reason=stale");

  // Players are pinned to their own club; admins may switch freely.
  let requested = searchParams.club ?? null;
  if (session.role === "player") {
    const me = overviewOnly.overview.players.find(
      (p) => p.id === session.playerId,
    );
    requested = me ? (me.clubName ?? "").trim() || me.name : null;
  }

  const data = await getClubHub(session.tournamentId, requested);
  if (!data) redirect("/api/auth/signout?reason=stale");

  if (!data.club || !data.row) {
    return (
      <>
        <TopNav session={session} />
        <PageShell>
          <PageHeader eyebrow="Team hub" title="Dashboard" />
          <EmptyState title="No teams to show">
            Teams appear once the tournament has players. An admin can add them
            from the admin panel.
          </EmptyState>
        </PageShell>
      </>
    );
  }

  const { overview, row, members, clubs, rank } = data;
  const memberIds = new Set(members.map((m) => m.playerId));

  // Cumulative team points by gameweek, from played matches only.
  const perRound = new Map<number, number>();
  for (const match of overview.matches) {
    if (!isPlayed(match)) continue;
    const home = match.homeGoals as number;
    const away = match.awayGoals as number;
    let gained = 0;
    if (memberIds.has(match.homePlayerId)) gained += pointsOf(home, away);
    if (memberIds.has(match.awayPlayerId)) gained += pointsOf(away, home);
    if (gained === 0 && !memberIds.has(match.homePlayerId) && !memberIds.has(match.awayPlayerId)) {
      continue;
    }
    perRound.set(match.round, (perRound.get(match.round) ?? 0) + gained);
  }

  let running = 0;
  const trend = [...perRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, gained]) => {
      running += gained;
      return { round, cumulative: running };
    });

  const winRate =
    row.played === 0 ? 0 : Math.round((row.won / row.played) * 100);
  const avgRating =
    members.length === 0
      ? 0
      : members.reduce((sum, m) => sum + m.rating, 0) / members.length;

  return (
    <>
      <TopNav session={session} />
      <PageShell>
        <PageHeader
          eyebrow="Team hub"
          title={data.club}
          lead={`Ranked #${rank} of ${clubs.length} in the winner race. Every number below is aggregated from this squad's individual 1v1 results.`}
          actions={
            session.role === "admin" ? (
              <Suspense fallback={null}>
                <ClubSwitcher clubs={clubs} active={data.club} />
              </Suspense>
            ) : null
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label="Position"
            value={`#${rank}`}
            sub={`of ${clubs.length} teams`}
            accent="gold"
          />
          <StatTile label="Points" value={row.points} accent="brand" />
          <StatTile
            label="Record"
            value={
              <span className="text-2xl">
                {row.won}-{row.drawn}-{row.lost}
              </span>
            }
            sub={`${winRate}% win rate`}
          />
          <StatTile
            label="Goal difference"
            value={`${row.goalDiff > 0 ? "+" : ""}${row.goalDiff}`}
            sub={`${row.goalsFor} for · ${row.goalsAgainst} against`}
            accent={row.goalDiff >= 0 ? "emerald" : "brand"}
          />
          <StatTile
            label="Avg rating"
            value={row.played === 0 ? "—" : avgRating.toFixed(2)}
            sub="Golden Ball scale"
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <TrendChart points={trend} />
          <ContributionChart members={members} />
        </div>

        <div className="mt-5">
          <RosterList
            members={members}
            highlight={
              session.role === "player" ? session.playerId : undefined
            }
          />
        </div>
      </PageShell>
    </>
  );
}
