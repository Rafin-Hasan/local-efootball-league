/**
 * Fixture generation — pure, deterministic, and safe to re-run.
 *
 * The admin can hit "generate" as many times as they like: already-played
 * results are never touched, only the scheduled tail is rebuilt.
 */

export type FixtureDraft = {
  round: number;
  homePlayerId: string;
  awayPlayerId: string;
};

const BYE = "__BYE__";

/**
 * Circle-method round robin: every player meets every other exactly once per
 * leg, and each round is a gameweek. With an odd roster one player sits out
 * each round.
 *
 * Home advantage alternates by round so the fixture list is not lopsided.
 */
export function generateRoundRobin(
  playerIds: string[],
  options: { legs?: 1 | 2 } = {},
): FixtureDraft[] {
  const legs = options.legs ?? 1;
  if (playerIds.length < 2) return [];

  const list = [...playerIds];
  if (list.length % 2 === 1) list.push(BYE);

  const half = list.length / 2;
  const roundsPerLeg = list.length - 1;
  const fixtures: FixtureDraft[] = [];
  let rotation = [...list];

  for (let round = 1; round <= roundsPerLeg; round += 1) {
    for (let i = 0; i < half; i += 1) {
      const a = rotation[i];
      const b = rotation[list.length - 1 - i];
      if (a === BYE || b === BYE) continue;

      const flip = round % 2 === 0;
      fixtures.push({
        round,
        homePlayerId: flip ? b : a,
        awayPlayerId: flip ? a : b,
      });
    }

    // Rotate every seat but the first.
    const [fixed, ...rest] = rotation;
    rotation = [fixed, rest[rest.length - 1], ...rest.slice(0, -1)];
  }

  if (legs === 1) return fixtures;

  // Second leg: same pairings, venues reversed, rounds continue.
  const reversed = fixtures.map((fixture) => ({
    round: fixture.round + roundsPerLeg,
    homePlayerId: fixture.awayPlayerId,
    awayPlayerId: fixture.homePlayerId,
  }));

  return [...fixtures, ...reversed];
}

export type ExistingMatch = {
  id: string;
  round: number;
  homePlayerId: string;
  awayPlayerId: string;
  status: string;
};

export type RegenerationPlan = {
  /** Scheduled matches safe to delete. */
  deleteIds: string[];
  /** Fixtures to insert. */
  create: FixtureDraft[];
  /** Played matches left untouched. */
  keptPlayed: number;
};

/** Order-independent key so a played A-vs-B is recognised as B-vs-A too. */
function pairKey(a: string, b: string, round: number): string {
  return [round, ...[a, b].sort()].join("|");
}

/**
 * Work out what to delete and what to insert so regenerating is non-destructive.
 *
 * Played matches are kept, and any draft that duplicates a played pairing in
 * the same round is dropped — otherwise regenerating would double up results.
 */
export function planRegeneration(
  existing: ExistingMatch[],
  drafts: FixtureDraft[],
): RegenerationPlan {
  const played = existing.filter((m) => m.status === "PLAYED");
  const scheduled = existing.filter((m) => m.status !== "PLAYED");

  const playedKeys = new Set(
    played.map((m) => pairKey(m.homePlayerId, m.awayPlayerId, m.round)),
  );

  const create = drafts.filter(
    (draft) =>
      !playedKeys.has(
        pairKey(draft.homePlayerId, draft.awayPlayerId, draft.round),
      ),
  );

  return {
    deleteIds: scheduled.map((m) => m.id),
    create,
    keptPlayed: played.length,
  };
}

/** Spread rounds evenly across the tournament window, one kickoff per round. */
export function roundKickoff(
  round: number,
  totalRounds: number,
  start: Date,
  end: Date,
): Date {
  if (totalRounds <= 1) return new Date(start);
  const span = end.getTime() - start.getTime();
  const step = span / totalRounds;
  return new Date(start.getTime() + step * (round - 1));
}
