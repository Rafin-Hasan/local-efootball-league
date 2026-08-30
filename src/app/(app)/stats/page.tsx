import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PlayerSwitcher } from "@/components/stats/PlayerCard";
import { StatsDossier } from "@/components/stats/StatsDossier";
import { EmptyState, PageHeader, PageShell } from "@/components/ui/Page";
import { getSession } from "@/lib/auth/session";
import {
  buildClubmates,
  buildHonours,
  buildRadar,
  playerMatches,
} from "@/lib/engine/profile";
import { withRatings } from "@/lib/engine/ratings";
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
        <PageShell>
          <PageHeader eyebrow="Dossier" title="My Stats" />
          <EmptyState title="No players in this tournament">
            Add players from the admin panel and their dossiers appear here.
          </EmptyState>
        </PageShell>
      </>
    );
  }

  const profile = await getPlayerProfile(session.tournamentId, targetId);
  if (!profile) redirect("/api/auth/signout?reason=stale");

  const { player, row, rating, rank, bootRank, ballRank, history, upcoming } =
    profile;

  // Derivations — all pure, all from the same match rows. See engine/profile.ts
  // for why there are no attributes, xG or timelines here.
  const nameOf = (id: string) =>
    overview.players.find((p) => p.id === id)?.name ?? "Unknown";

  const axes = buildRadar(row, overview.standings);
  const games = playerMatches(targetId, overview.matches, nameOf);
  const honours = buildHonours(row, games, {
    boot: bootRank,
    ball: ballRank,
    league: rank,
    total: overview.playerCount,
  });
  const clubmates = buildClubmates(
    { id: player.id, clubName: player.clubName, name: player.name },
    withRatings(overview.standings),
    overview.matches,
  );

  const perMatch = (n: number) =>
    row.played === 0 ? "—" : (n / row.played).toFixed(2);

  const tiles: React.ComponentProps<typeof StatsDossier>["tiles"] = [
    {
      key: "goals",
      label: bootRank === 1 && row.goalsFor > 0 ? "Boot #1" : `Boot #${bootRank || "—"}`,
      value: String(row.goalsFor),
      sub: "Goals scored",
      icon: "flame",
      tone: "gold",
      trend: row.played ? `${perMatch(row.goalsFor)} per match` : undefined,
    },
    {
      key: "points",
      label: `League #${rank || "—"}`,
      value: String(row.points),
      sub: "Points won",
      icon: "bolt",
      tone: "brand",
      trend: row.played ? `${perMatch(row.points)} per match` : undefined,
    },
    {
      key: "clean",
      label: "Defence",
      value: String(row.cleanSheets),
      sub: "Clean sheets",
      icon: "shield",
      tone: "win",
      trend: row.played ? `${perMatch(row.goalsAgainst)} conceded / match` : undefined,
    },
    {
      key: "rating",
      label: `Ball #${ballRank || "—"}`,
      value: row.played === 0 ? "—" : rating.toFixed(2),
      sub: "Golden Ball rating",
      icon: "target",
      tone: "ink",
      trend: row.played
        ? `over ${row.played} match${row.played === 1 ? "" : "es"}`
        : undefined,
    },
  ];

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Dossier"
          title={session.role === "player" ? "My Stats" : "Player Dossier"}
          lead="The full competitive record: headline figures, a six-axis profile measured against the league, earned honours, and the clubmates around this player."
          actions={
            session.role === "admin" ? (
              <Suspense fallback={null}>
                <PlayerSwitcher players={overview.players} active={targetId} />
              </Suspense>
            ) : null
          }
        />

        <StatsDossier
          name={player.name}
          club={player.clubName}
          row={row}
          rating={rating}
          leagueRank={rank}
          bootRank={bootRank}
          ballRank={ballRank}
          totalPlayers={overview.playerCount}
          axes={axes}
          honours={honours}
          clubmates={clubmates}
          history={history}
          upcoming={upcoming}
          tiles={tiles}
        />
      </PageShell>
    </>
  );
}
