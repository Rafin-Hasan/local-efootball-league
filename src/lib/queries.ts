import { cache } from "react";
import { db } from "@/lib/db";
import { roundKickoff } from "@/lib/engine/fixtures";
import { goldenBallRace, goldenBootRace, ratingOf } from "@/lib/engine/ratings";
import {
  buildClubStandings,
  buildPlayerStandings,
  isPlayed,
} from "@/lib/engine/standings";
import { outcomeOf } from "@/lib/engine/scoring";

const MATCH_SELECT = {
  id: true,
  round: true,
  homePlayerId: true,
  awayPlayerId: true,
  homeGoals: true,
  awayGoals: true,
  status: true,
  playedAt: true,
} as const;

/**
 * One query per request, memoised for the render pass, then reduced in memory.
 * Standings, ratings and the three races all fall out of the same match rows.
 */
export const getLeagueOverview = cache(async (tournamentId: string) => {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      rules: true,
      players: {
        select: { id: true, name: true, clubName: true },
        orderBy: { name: "asc" },
      },
      matches: { select: MATCH_SELECT },
    },
  });

  if (!tournament) return null;

  const playerRows = buildPlayerStandings(
    tournament.players,
    tournament.matches,
  );

  const playedCount = tournament.matches.filter(isPlayed).length;
  const rounds = tournament.matches.reduce(
    (max, m) => Math.max(max, m.round),
    0,
  );

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: tournament.status,
      rules: tournament.rules,
    },
    players: tournament.players,
    matches: tournament.matches,
    rounds,
    playerCount: tournament.players.length,
    matchCount: tournament.matches.length,
    playedCount,
    standings: playerRows,
    goldenBoot: goldenBootRace(playerRows),
    goldenBall: goldenBallRace(playerRows),
    clubRace: buildClubStandings(playerRows),
  };
});

export type LeagueOverview = NonNullable<
  Awaited<ReturnType<typeof getLeagueOverview>>
>;

export type FixtureRow = {
  id: string;
  round: number;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeClub: string | null;
  awayClub: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  played: boolean;
  playedAt: Date | null;
};

export type FixtureRound = {
  round: number;
  kickoff: Date;
  played: number;
  total: number;
  matches: FixtureRow[];
};

/** Fixtures grouped into gameweeks, with a kickoff derived per round. */
export const getFixtureRounds = cache(async (tournamentId: string) => {
  const overview = await getLeagueOverview(tournamentId);
  if (!overview) return null;

  const byId = new Map(overview.players.map((p) => [p.id, p]));
  const totalRounds = overview.rounds;

  const grouped = new Map<number, FixtureRow[]>();
  for (const match of overview.matches) {
    const home = byId.get(match.homePlayerId);
    const away = byId.get(match.awayPlayerId);
    const row: FixtureRow = {
      id: match.id,
      round: match.round,
      homeId: match.homePlayerId,
      awayId: match.awayPlayerId,
      homeName: home?.name ?? "Unknown",
      awayName: away?.name ?? "Unknown",
      homeClub: home?.clubName ?? null,
      awayClub: away?.clubName ?? null,
      homeGoals: match.homeGoals,
      awayGoals: match.awayGoals,
      played: isPlayed(match),
      playedAt: match.playedAt,
    };
    const list = grouped.get(match.round);
    if (list) list.push(row);
    else grouped.set(match.round, [row]);
  }

  const rounds: FixtureRound[] = [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, matches]) => ({
      round,
      kickoff: roundKickoff(
        round,
        totalRounds,
        overview.tournament.startDate,
        overview.tournament.endDate,
      ),
      played: matches.filter((m) => m.played).length,
      total: matches.length,
      matches: matches.sort((a, b) => a.homeName.localeCompare(b.homeName)),
    }));

  return { ...overview, rounds: rounds };
});

export type PlayerMatchRow = {
  id: string;
  round: number;
  opponent: string;
  opponentClub: string | null;
  goalsFor: number;
  goalsAgainst: number;
  outcome: "W" | "D" | "L";
  playedAt: Date | null;
  home: boolean;
};

/** Everything the personal stats page needs for one player. */
export const getPlayerProfile = cache(
  async (tournamentId: string, playerId: string) => {
    const overview = await getLeagueOverview(tournamentId);
    if (!overview) return null;

    const player = overview.players.find((p) => p.id === playerId);
    if (!player) return null;

    const rank =
      overview.standings.findIndex((r) => r.playerId === playerId) + 1;
    const row = overview.standings.find((r) => r.playerId === playerId)!;
    const bootRank =
      overview.goldenBoot.findIndex((r) => r.playerId === playerId) + 1;
    const ballRank =
      overview.goldenBall.findIndex((r) => r.playerId === playerId) + 1;

    const byId = new Map(overview.players.map((p) => [p.id, p]));

    const history: PlayerMatchRow[] = overview.matches
      .filter(
        (m) =>
          isPlayed(m) &&
          (m.homePlayerId === playerId || m.awayPlayerId === playerId),
      )
      .map((m) => {
        const home = m.homePlayerId === playerId;
        const goalsFor = (home ? m.homeGoals : m.awayGoals) as number;
        const goalsAgainst = (home ? m.awayGoals : m.homeGoals) as number;
        const opponentId = home ? m.awayPlayerId : m.homePlayerId;
        const opponent = byId.get(opponentId);
        return {
          id: m.id,
          round: m.round,
          opponent: opponent?.name ?? "Unknown",
          opponentClub: opponent?.clubName ?? null,
          goalsFor,
          goalsAgainst,
          outcome: outcomeOf(goalsFor, goalsAgainst),
          playedAt: m.playedAt,
          home,
        };
      })
      .sort((a, b) => b.round - a.round);

    const upcoming = overview.matches
      .filter(
        (m) =>
          !isPlayed(m) &&
          (m.homePlayerId === playerId || m.awayPlayerId === playerId),
      )
      .map((m) => {
        const home = m.homePlayerId === playerId;
        const opponentId = home ? m.awayPlayerId : m.homePlayerId;
        return {
          id: m.id,
          round: m.round,
          opponent: byId.get(opponentId)?.name ?? "Unknown",
          home,
        };
      })
      .sort((a, b) => a.round - b.round);

    return {
      overview,
      player,
      row,
      rating: ratingOf(row),
      rank,
      bootRank,
      ballRank,
      history,
      upcoming,
    };
  },
);

/** Club-level view for the dashboard. */
export const getClubHub = cache(
  async (tournamentId: string, club: string | null) => {
    const overview = await getLeagueOverview(tournamentId);
    if (!overview) return null;

    const clubs = overview.clubRace;
    const resolved =
      club && clubs.some((c) => c.club === club) ? club : clubs[0]?.club ?? null;
    if (!resolved) return { overview, clubs, club: null, row: null, members: [] };

    const row = clubs.find((c) => c.club === resolved) ?? null;
    const members = overview.standings
      .filter((r) => ((r.clubName ?? "").trim() || r.name) === resolved)
      .map((r) => ({ ...r, rating: ratingOf(r) }));

    return {
      overview,
      clubs,
      club: resolved,
      row,
      members,
      rank: clubs.findIndex((c) => c.club === resolved) + 1,
    };
  },
);

/** Admin control room: rosters with their codes, plus every fixture. */
export const getAdminData = cache(async (tournamentId: string) => {
  const bundle = await getFixtureRounds(tournamentId);
  if (!bundle) return null;

  const players = await db.player.findMany({
    where: { tournamentId },
    select: {
      id: true,
      name: true,
      clubName: true,
      accessCode: true,
      inviteCode: true,
    },
    orderBy: { name: "asc" },
  });

  return { ...bundle, roster: players };
});
