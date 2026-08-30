/**
 * Player dossier derivations.
 *
 * Everything here comes out of `PlayerRow` and `Match` rows that already exist.
 * Nothing is invented: there is no shot, possession, minute or assist data in
 * the schema, so there are no attributes, xG or timelines here either. The six
 * radar axes are real measurements of a 1v1 record, not FIFA-style ratings.
 */

import { outcomeOf } from "@/lib/engine/scoring";
import { isPlayed, type MatchLike, type PlayerRow } from "@/lib/engine/standings";

/* ------------------------------------------------------------------ radar */

export type AxisKey = "ATT" | "DEF" | "WIN" | "MAR" | "CLS" | "FRM";

export type RadarAxis = {
  key: AxisKey;
  label: string;
  /** What the number actually measures, shown on inspect. */
  detail: string;
  /** 0-100 for this player. */
  value: number;
  /** 0-100 for the league, computed by the identical formula. */
  leagueAvg: number;
  /** The underlying figure, so the card can show the real unit. */
  raw: string;
};

/**
 * Caps turn an unbounded rate into a 0-100 axis. They are deliberately fixed
 * rather than min-maxed against the league: with eight players a min-max scale
 * would rescale every time one result lands, so nobody could compare a profile
 * across two weeks.
 */
const CAP = {
  goalsPerMatch: 4,
  concededPerMatch: 4,
  margin: 3,
} as const;

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const per = (total: number, played: number) => (played === 0 ? 0 : total / played);

/** Points from the last five, as a share of the 15 available. */
function formScore(row: PlayerRow): number {
  if (row.form.length === 0) return 0;
  const pts = row.form.reduce(
    (sum, o) => sum + (o === "W" ? 3 : o === "D" ? 1 : 0),
    0,
  );
  return (pts / (row.form.length * 3)) * 100;
}

function axesFor(row: PlayerRow): Record<AxisKey, number> {
  // No matches means no evidence. Without this, an unplayed record scores 100
  // for Defence (conceded nothing) and 50 for Margin (level) — a perfect
  // defensive profile for someone who has never taken the pitch.
  if (row.played === 0) {
    return { ATT: 0, DEF: 0, WIN: 0, MAR: 0, CLS: 0, FRM: 0 };
  }

  const gf = per(row.goalsFor, row.played);
  const ga = per(row.goalsAgainst, row.played);
  const margin = per(row.goalDiff, row.played);

  return {
    ATT: clamp((gf / CAP.goalsPerMatch) * 100),
    // Inverted: conceding nothing is 100, conceding the cap is 0.
    DEF: clamp(100 - (ga / CAP.concededPerMatch) * 100),
    WIN: clamp(per(row.won, row.played) * 100),
    // Margin runs -cap..+cap, so shift it into 0..100 with 50 = level.
    MAR: clamp(((margin + CAP.margin) / (CAP.margin * 2)) * 100),
    CLS: clamp(per(row.cleanSheets, row.played) * 100),
    FRM: clamp(formScore(row)),
  };
}

const LABELS: Record<AxisKey, { label: string; detail: string }> = {
  ATT: { label: "Attack", detail: "Goals scored per match" },
  DEF: { label: "Defence", detail: "Goals conceded per match, inverted" },
  WIN: { label: "Win rate", detail: "Share of matches won" },
  MAR: { label: "Margin", detail: "Average goal difference per match" },
  CLS: { label: "Clean sheets", detail: "Share of matches without conceding" },
  FRM: { label: "Form", detail: "Points from the last five, out of 15" },
};

/**
 * Six axes for one player, each paired with the league average computed the
 * same way, so "above average" means something exact.
 */
export function buildRadar(row: PlayerRow, league: PlayerRow[]): RadarAxis[] {
  const mine = axesFor(row);

  // Average across players who have actually played, so unplayed entrants do
  // not drag the benchmark to zero.
  const active = league.filter((r) => r.played > 0);
  const avg = (key: AxisKey) =>
    active.length === 0
      ? 0
      : active.reduce((sum, r) => sum + axesFor(r)[key], 0) / active.length;

  const raw: Record<AxisKey, string> = {
    ATT: `${per(row.goalsFor, row.played).toFixed(2)} / match`,
    DEF: `${per(row.goalsAgainst, row.played).toFixed(2)} conceded / match`,
    WIN: `${row.won} of ${row.played}`,
    MAR: `${row.goalDiff >= 0 ? "+" : ""}${per(row.goalDiff, row.played).toFixed(2)} / match`,
    CLS: `${row.cleanSheets} of ${row.played}`,
    FRM: row.form.length ? row.form.join(" ") : "no matches",
  };

  return (Object.keys(LABELS) as AxisKey[]).map((key) => ({
    key,
    label: LABELS[key].label,
    detail: LABELS[key].detail,
    value: Math.round(mine[key]),
    leagueAvg: Math.round(avg(key)),
    raw: raw[key],
  }));
}

/* --------------------------------------------------------------- honours */

export type Honour = {
  id: string;
  name: string;
  detail: string;
  /** Rendered as a small right-hand pill. */
  pill: string;
  tone: "gold" | "brand" | "win" | "ink";
};

type PlayerMatch = { goalsFor: number; goalsAgainst: number; round: number; opponent: string };

/** Every played match for one player, from that player's point of view. */
export function playerMatches(
  playerId: string,
  matches: MatchLike[],
  nameOf: (id: string) => string,
): PlayerMatch[] {
  return matches
    .filter(
      (m) =>
        isPlayed(m) && (m.homePlayerId === playerId || m.awayPlayerId === playerId),
    )
    .map((m) => {
      const home = m.homePlayerId === playerId;
      return {
        goalsFor: (home ? m.homeGoals : m.awayGoals) as number,
        goalsAgainst: (home ? m.awayGoals : m.homeGoals) as number,
        round: m.round,
        opponent: nameOf(home ? m.awayPlayerId : m.homePlayerId),
      };
    })
    .sort((a, b) => a.round - b.round);
}

/** Longest run without losing, counted over matches in round order. */
export function longestUnbeatenRun(games: PlayerMatch[]): number {
  let best = 0;
  let run = 0;
  for (const g of games) {
    if (g.goalsFor >= g.goalsAgainst) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * Achievements that are genuinely provable from the record. Anything that
 * cannot be proven (MVP votes, hat-trick *types*, market value) is absent by
 * design rather than estimated.
 */
export function buildHonours(
  row: PlayerRow,
  games: PlayerMatch[],
  ranks: { boot: number; ball: number; league: number; total: number },
): Honour[] {
  const out: Honour[] = [];

  const hatTricks = games.filter((g) => g.goalsFor >= 3);
  const biggest = [...games].sort(
    (a, b) => b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst),
  )[0];
  const unbeaten = longestUnbeatenRun(games);
  const perfect = games.filter((g) => g.goalsFor > g.goalsAgainst && g.goalsAgainst === 0);

  if (ranks.boot === 1 && row.goalsFor > 0) {
    out.push({
      id: "boot",
      name: "Golden Boot leader",
      detail: `${row.goalsFor} goals in ${row.played} matches`,
      pill: "League #1",
      tone: "gold",
    });
  }

  if (ranks.ball === 1 && row.played > 0) {
    out.push({
      id: "ball",
      name: "Golden Ball leader",
      detail: "Top overall rating across the league",
      pill: "League #1",
      tone: "gold",
    });
  }

  if (hatTricks.length > 0) {
    out.push({
      id: "hat",
      name: hatTricks.length === 1 ? "Hat-trick" : `${hatTricks.length} hat-tricks`,
      detail: hatTricks
        .map((g) => `${g.goalsFor}-${g.goalsAgainst} v ${g.opponent} (GW${g.round})`)
        .join(" · "),
      pill: "3+ goals",
      tone: "brand",
    });
  }

  // A one-goal win is not an honour; every player in a league has one. Two
  // clear goals is the smallest margin worth putting on the board.
  if (biggest && biggest.goalsFor - biggest.goalsAgainst >= 2) {
    out.push({
      id: "big",
      name: "Biggest win",
      detail: `${biggest.goalsFor}-${biggest.goalsAgainst} against ${biggest.opponent} in gameweek ${biggest.round}`,
      pill: `+${biggest.goalsFor - biggest.goalsAgainst}`,
      tone: "win",
    });
  }

  if (unbeaten >= 3) {
    out.push({
      id: "run",
      name: "Unbeaten run",
      detail: `${unbeaten} matches without defeat`,
      pill: `${unbeaten} matches`,
      tone: "win",
    });
  }

  if (perfect.length > 0) {
    out.push({
      id: "perfect",
      name: perfect.length === 1 ? "Perfect game" : `${perfect.length} perfect games`,
      detail: "Won without conceding",
      pill: `${row.cleanSheets} clean sheet${row.cleanSheets === 1 ? "" : "s"}`,
      tone: "brand",
    });
  }

  if (ranks.league <= 3 && row.played > 0) {
    out.push({
      id: "podium",
      name: `Podium place`,
      detail: `${ordinal(ranks.league)} of ${ranks.total} in the league table`,
      pill: `#${ranks.league}`,
      tone: "ink",
    });
  }

  return out;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/* -------------------------------------------------------------- clubmates */

export type Clubmate = {
  playerId: string;
  name: string;
  played: number;
  points: number;
  goalsFor: number;
  rating: number;
  /** This player's record against them: W-D-L. */
  head: { won: number; drawn: number; lost: number; played: number };
};

/** Same-club players, each with the real head-to-head against this player. */
export function buildClubmates(
  player: { id: string; clubName: string | null; name: string },
  league: (PlayerRow & { rating: number })[],
  matches: MatchLike[],
): Clubmate[] {
  const club = (player.clubName ?? "").trim() || player.name;

  return league
    .filter(
      (r) =>
        r.playerId !== player.id &&
        ((r.clubName ?? "").trim() || r.name) === club,
    )
    .map((r) => {
      const head = { won: 0, drawn: 0, lost: 0, played: 0 };
      for (const m of matches) {
        if (!isPlayed(m)) continue;
        const pair =
          (m.homePlayerId === player.id && m.awayPlayerId === r.playerId) ||
          (m.awayPlayerId === player.id && m.homePlayerId === r.playerId);
        if (!pair) continue;

        const home = m.homePlayerId === player.id;
        const gf = (home ? m.homeGoals : m.awayGoals) as number;
        const ga = (home ? m.awayGoals : m.homeGoals) as number;
        const outcome = outcomeOf(gf, ga);
        head.played += 1;
        if (outcome === "W") head.won += 1;
        else if (outcome === "D") head.drawn += 1;
        else head.lost += 1;
      }

      return {
        playerId: r.playerId,
        name: r.name,
        played: r.played,
        points: r.points,
        goalsFor: r.goalsFor,
        rating: r.rating,
        head,
      };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}
