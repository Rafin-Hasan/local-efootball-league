import { clamp } from "./scoring";
import type { PlayerRow } from "./standings";

/**
 * Golden Ball rating — a deterministic 0-10 score.
 *
 * Built from four signals, then shrunk toward the 5.0 baseline by appearance
 * count so a player who won their only match does not outrank someone unbeaten
 * over ten. `PRIOR` is the number of "phantom average matches" every player
 * carries; higher means slower to trust a small sample.
 */
const BASELINE = 5;
const PRIOR = 3;

export const RATING_WEIGHTS = {
  winRate: 2.6,
  drawRate: 0.7,
  avgGoalDiff: 0.45,
  cleanSheetRate: 0.8,
  avgGoalsFor: 0.22,
} as const;

/** Goal difference per match is clamped so one 9-0 rout cannot dominate. */
const GOAL_DIFF_CAP = 3;
const GOALS_FOR_CAP = 4;

export function ratingOf(row: PlayerRow): number {
  if (row.played === 0) return 0;

  const winRate = row.won / row.played;
  const drawRate = row.drawn / row.played;
  const cleanSheetRate = row.cleanSheets / row.played;
  const avgGoalDiff = clamp(
    row.goalDiff / row.played,
    -GOAL_DIFF_CAP,
    GOAL_DIFF_CAP,
  );
  const avgGoalsFor = Math.min(row.goalsFor / row.played, GOALS_FOR_CAP);

  const raw =
    BASELINE +
    RATING_WEIGHTS.winRate * winRate +
    RATING_WEIGHTS.drawRate * drawRate +
    RATING_WEIGHTS.avgGoalDiff * avgGoalDiff +
    RATING_WEIGHTS.cleanSheetRate * cleanSheetRate +
    RATING_WEIGHTS.avgGoalsFor * avgGoalsFor;

  // Bayesian shrink toward the baseline on thin samples.
  const confidence = row.played / (row.played + PRIOR);
  const adjusted = BASELINE + (raw - BASELINE) * confidence;

  return Math.round(clamp(adjusted, 0, 10) * 100) / 100;
}

export type RatedPlayer = PlayerRow & { rating: number };

export function withRatings(rows: PlayerRow[]): RatedPlayer[] {
  return rows.map((row) => ({ ...row, rating: ratingOf(row) }));
}

/** Golden Ball race — best rating first, appearances then name as tiebreaks. */
export function goldenBallRace(rows: PlayerRow[]): RatedPlayer[] {
  return withRatings(rows).sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.played !== a.played) return b.played - a.played;
    return a.name.localeCompare(b.name);
  });
}

/** Golden Boot race — goals first, then fewer matches used, then name. */
export function goldenBootRace(rows: PlayerRow[]): PlayerRow[] {
  return [...rows].sort((a, b) => {
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (a.played !== b.played) return a.played - b.played;
    return a.name.localeCompare(b.name);
  });
}
