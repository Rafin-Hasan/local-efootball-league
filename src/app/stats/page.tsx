import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TopNav } from "@/components/shell/TopNav";
import {
  MatchHistory,
  PlayerSwitcher,
  PortfolioCard,
  ResultSplit,
  UpcomingList,
} from "@/components/stats/PlayerCard";
import { EmptyState, PageHeader, PageShell, StatTile } from "@/components/ui/Page";
import { getSession } from "@/lib/auth/session";
import { getLeagueOverview, getPlayerProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "My Stats" };

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { player?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const overview = await getLeagueOverview(session.tournamentId);
  if (!overview) redirect("/api/auth/signout?reason=stale");

  // Players always see themselves; admins may inspect anyone.
  const targetId =
    session.role === "player"
      ? session.playerId
      : (searchParams.player &&
          overview.players.some((p) => p.id === searchParams.player)
          ? searchParams.player
          : overview.players[0]?.id) ?? null;

  if (!targetId) {
    return (
      <>
        <TopNav session={session} />
        <PageShell>
          <PageHeader eyebrow="Portfolio" title="My Stats" />
          <EmptyState title="No players in this tournament">
            Add players from the admin panel and their stat portfolios appear
            here.
          </EmptyState>
        </PageShell>
      </>
    );
  }

  const profile = await getPlayerProfile(session.tournamentId, targetId);
  if (!profile) redirect("/api/auth/signout?reason=stale");

  const { player, row, rating, rank, bootRank, ballRank, history, upcoming } =
    profile;

  const goalsPerGame =
    row.played === 0 ? 0 : row.goalsFor / row.played;

  return (
    <>
      <TopNav session={session} />
      <PageShell>
        <PageHeader
          eyebrow="Portfolio"
          title={session.role === "player" ? "My Stats" : "Player Stats"}
          lead="Every figure is derived live from played 1v1 results — ratings are weighted by appearances, so a small sample never outranks a proven record."
          actions={
            session.role === "admin" ? (
              <Suspense fallback={null}>
                <PlayerSwitcher players={overview.players} active={targetId} />
              </Suspense>
            ) : null
          }
        />

        <PortfolioCard
          name={player.name}
          club={player.clubName}
          rating={rating}
          rank={rank}
          totalPlayers={overview.playerCount}
          bootRank={bootRank}
          ballRank={ballRank}
          form={row.form}
        />

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Points" value={row.points} accent="brand" />
          <StatTile
            label="Goals"
            value={row.goalsFor}
            sub={`${goalsPerGame.toFixed(2)} per match`}
            accent="gold"
          />
          <StatTile label="Conceded" value={row.goalsAgainst} />
          <StatTile
            label="Clean sheets"
            value={row.cleanSheets}
            accent="emerald"
          />
          <StatTile
            label="Goal difference"
            value={`${row.goalDiff > 0 ? "+" : ""}${row.goalDiff}`}
            accent={row.goalDiff >= 0 ? "emerald" : "brand"}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ResultSplit row={row} />
          <UpcomingList upcoming={upcoming} />
        </div>

        <div className="mt-5">
          <MatchHistory history={history} />
        </div>
      </PageShell>
    </>
  );
}
