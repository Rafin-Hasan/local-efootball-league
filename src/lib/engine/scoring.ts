/**
 * Scoring primitives shared by the standings and ratings reducers.
 * Pure — no Prisma, no dates, no I/O — so every rule here is unit-testable.
 */

export type Outcome = "W" | "D" | "L";

export const POINTS: Record<Outcome, number> = {
  W: 3,
  D: 1,
  L: 0,
};

/** Result of a 1v1 from the perspective of one player. */
export function outcomeOf(goalsFor: number, goalsAgainst: number): Outcome {
  if (goalsFor > goalsAgainst) return "W";
  if (goalsFor < goalsAgainst) return "L";
  return "D";
}

export function pointsOf(goalsFor: number, goalsAgainst: number): number {
  return POINTS[outcomeOf(goalsFor, goalsAgainst)];
}

export function isCleanSheet(goalsAgainst: number): boolean {
  return goalsAgainst === 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * A single played 1v1 flattened to one player's point of view.
 * Both sides of a Match produce one of these.
 */
export type PlayerMatchView = {
  playerId: string;
  opponentId: string;
  goalsFor: number;
  goalsAgainst: number;
  playedAt: Date | null;
  round: number;
};
