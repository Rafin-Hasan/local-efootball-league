import {
  type Outcome,
  type PlayerMatchView,
  isCleanSheet,
  outcomeOf,
  pointsOf,
} from "./scoring";

export type PlayerLike = {
  id: string;
  name: string;
  clubName: string | null;
};

export type MatchLike = {
  id: string;
  round: number;
  homePlayerId: string;
  awayPlayerId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  playedAt: Date | null;
};

export type PlayerRow = {
  playerId: string;
  name: string;
  clubName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  cleanSheets: number;
  points: number;
  /** Most recent first, capped at 5. */
  form: Outcome[];
};

export type ClubRow = {
  club: string;
  members: string[];
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

/** A match counts only once both scores are present and it is marked played. */
export function isPlayed(match: MatchLike): boolean {
  return (
    match.status === "PLAYED" &&
    match.homeGoals !== null &&
    match.awayGoals !== null
  );
}

/** Explode played matches into one view per participant. */
export function toPlayerViews(matches: MatchLike[]): PlayerMatchView[] {
  const views: PlayerMatchView[] = [];
  for (const match of matches) {
    if (!isPlayed(match)) continue;
    const home = match.homeGoals as number;
    const away = match.awayGoals as number;
    views.push({
      playerId: match.homePlayerId,
      opponentId: match.awayPlayerId,
      goalsFor: home,
      goalsAgainst: away,
      playedAt: match.playedAt,
      round: match.round,
    });
    views.push({
      playerId: match.awayPlayerId,
      opponentId: match.homePlayerId,
      goalsFor: away,
      goalsAgainst: home,
      playedAt: match.playedAt,
      round: match.round,
    });
  }
  return views;
}

function emptyRow(player: PlayerLike): PlayerRow {
  return {
    playerId: player.id,
    name: player.name,
    clubName: player.clubName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    cleanSheets: 0,
    points: 0,
    form: [],
  };
}

/** Newest first: later rounds win, then later kickoff timestamps. */
function byRecencyDesc(a: PlayerMatchView, b: PlayerMatchView): number {
  if (a.round !== b.round) return b.round - a.round;
  const at = a.playedAt ? a.playedAt.getTime() : 0;
  const bt = b.playedAt ? b.playedAt.getTime() : 0;
  return bt - at;
}

/**
 * Reduce every played 1v1 into one row per player.
 * Players with no matches still appear, on zero — a brand-new tournament
 * should render a full table, not an empty one.
 */
export function buildPlayerStandings(
  players: PlayerLike[],
  matches: MatchLike[],
): PlayerRow[] {
  const rows = new Map<string, PlayerRow>();
  for (const player of players) rows.set(player.id, emptyRow(player));

  const views = toPlayerViews(matches);

  for (const view of views) {
    const row = rows.get(view.playerId);
    if (!row) continue; // match references a deleted player
    const outcome = outcomeOf(view.goalsFor, view.goalsAgainst);
    row.played += 1;
    if (outcome === "W") row.won += 1;
    else if (outcome === "D") row.drawn += 1;
    else row.lost += 1;
    row.goalsFor += view.goalsFor;
    row.goalsAgainst += view.goalsAgainst;
    row.points += pointsOf(view.goalsFor, view.goalsAgainst);
    if (isCleanSheet(view.goalsAgainst)) row.cleanSheets += 1;
  }

  for (const [playerId, row] of rows) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
    row.form = views
      .filter((v) => v.playerId === playerId)
      .sort(byRecencyDesc)
      .slice(0, 5)
      .map((v) => outcomeOf(v.goalsFor, v.goalsAgainst));
  }

  return [...rows.values()].sort(comparePlayerRows(matches));
}

/**
 * Points, then goal difference, then goals scored, then head-to-head,
 * then name for a stable, deterministic order.
 */
export function comparePlayerRows(matches: MatchLike[] = []) {
  return (a: PlayerRow, b: PlayerRow): number => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const h2h = headToHead(a.playerId, b.playerId, matches);
    if (h2h !== 0) return h2h;
    return a.name.localeCompare(b.name);
  };
}

/** Negative if `a` ranks above `b` on their shared results. */
export function headToHead(
  a: string,
  b: string,
  matches: MatchLike[],
): number {
  let aPoints = 0;
  let bPoints = 0;
  for (const match of matches) {
    if (!isPlayed(match)) continue;
    const pair =
      (match.homePlayerId === a && match.awayPlayerId === b) ||
      (match.homePlayerId === b && match.awayPlayerId === a);
    if (!pair) continue;
    const home = match.homeGoals as number;
    const away = match.awayGoals as number;
    if (match.homePlayerId === a) {
      aPoints += pointsOf(home, away);
      bPoints += pointsOf(away, home);
    } else {
      bPoints += pointsOf(home, away);
      aPoints += pointsOf(away, home);
    }
  }
  return bPoints - aPoints;
}

/**
 * Aggregate player rows up into club rows — the "winner race".
 * Players with no club fall back to their own name so nobody is dropped.
 */
export function buildClubStandings(rows: PlayerRow[]): ClubRow[] {
  const clubs = new Map<string, ClubRow>();

  for (const row of rows) {
    const club = (row.clubName ?? "").trim() || row.name;
    const entry =
      clubs.get(club) ??
      ({
        club,
        members: [],
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      } satisfies ClubRow);

    entry.members.push(row.name);
    entry.played += row.played;
    entry.won += row.won;
    entry.drawn += row.drawn;
    entry.lost += row.lost;
    entry.goalsFor += row.goalsFor;
    entry.goalsAgainst += row.goalsAgainst;
    entry.points += row.points;
    clubs.set(club, entry);
  }

  for (const entry of clubs.values()) {
    entry.goalDiff = entry.goalsFor - entry.goalsAgainst;
    entry.members.sort((a, b) => a.localeCompare(b));
  }

  return [...clubs.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.club.localeCompare(b.club);
  });
}
