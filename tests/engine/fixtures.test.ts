import { describe, expect, it } from "vitest";
import {
  generateRoundRobin,
  planRegeneration,
  roundKickoff,
  type ExistingMatch,
} from "@/lib/engine/fixtures";

const four = ["a", "b", "c", "d"];

describe("generateRoundRobin", () => {
  it("returns nothing for fewer than two players", () => {
    expect(generateRoundRobin([])).toEqual([]);
    expect(generateRoundRobin(["a"])).toEqual([]);
  });

  it("pairs every player exactly once in a single leg", () => {
    const fixtures = generateRoundRobin(four);
    expect(fixtures).toHaveLength(6); // 4C2

    const pairs = fixtures.map((f) =>
      [f.homePlayerId, f.awayPlayerId].sort().join("-"),
    );
    expect(new Set(pairs).size).toBe(6);
  });

  it("uses n-1 rounds and never repeats a player within a round", () => {
    const fixtures = generateRoundRobin(four);
    const rounds = new Set(fixtures.map((f) => f.round));
    expect(rounds.size).toBe(3);

    for (const round of rounds) {
      const inRound = fixtures.filter((f) => f.round === round);
      const seen = inRound.flatMap((f) => [f.homePlayerId, f.awayPlayerId]);
      expect(new Set(seen).size).toBe(seen.length);
    }
  });

  it("gives one player a bye each round on an odd roster", () => {
    const fixtures = generateRoundRobin(["a", "b", "c", "d", "e"]);
    expect(fixtures).toHaveLength(10); // 5C2
    expect(fixtures.every((f) => f.homePlayerId !== f.awayPlayerId)).toBe(true);

    for (let round = 1; round <= 5; round += 1) {
      expect(fixtures.filter((f) => f.round === round)).toHaveLength(2);
    }
  });

  it("doubles the fixtures and reverses venues over two legs", () => {
    const single = generateRoundRobin(four);
    const double = generateRoundRobin(four, { legs: 2 });
    expect(double).toHaveLength(single.length * 2);

    const first = single[0];
    const mirror = double.find(
      (f) =>
        f.round === first.round + 3 &&
        f.homePlayerId === first.awayPlayerId &&
        f.awayPlayerId === first.homePlayerId,
    );
    expect(mirror).toBeDefined();
  });

  it("is deterministic for the same input", () => {
    expect(generateRoundRobin(four)).toEqual(generateRoundRobin(four));
  });
});

describe("planRegeneration", () => {
  const drafts = generateRoundRobin(four);

  function existing(over: Partial<ExistingMatch> & { id: string }): ExistingMatch {
    return {
      round: 1,
      homePlayerId: "a",
      awayPlayerId: "b",
      status: "SCHEDULED",
      ...over,
    };
  }

  it("creates everything when nothing exists", () => {
    const plan = planRegeneration([], drafts);
    expect(plan.create).toHaveLength(drafts.length);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.keptPlayed).toBe(0);
  });

  it("deletes only scheduled matches", () => {
    const plan = planRegeneration(
      [
        existing({ id: "s1", status: "SCHEDULED" }),
        existing({ id: "p1", status: "PLAYED", round: 2 }),
      ],
      drafts,
    );
    expect(plan.deleteIds).toEqual(["s1"]);
    expect(plan.keptPlayed).toBe(1);
  });

  it("does not recreate a pairing that has already been played", () => {
    const target = drafts[0];
    const plan = planRegeneration(
      [
        existing({
          id: "p1",
          status: "PLAYED",
          round: target.round,
          homePlayerId: target.homePlayerId,
          awayPlayerId: target.awayPlayerId,
        }),
      ],
      drafts,
    );
    expect(plan.create).toHaveLength(drafts.length - 1);
  });

  it("matches a played pairing regardless of which side was home", () => {
    const target = drafts[0];
    const plan = planRegeneration(
      [
        existing({
          id: "p1",
          status: "PLAYED",
          round: target.round,
          homePlayerId: target.awayPlayerId,
          awayPlayerId: target.homePlayerId,
        }),
      ],
      drafts,
    );
    expect(plan.create).toHaveLength(drafts.length - 1);
  });

  it("is stable when run twice in a row", () => {
    const first = planRegeneration([], drafts);
    const asExisting: ExistingMatch[] = first.create.map((draft, i) => ({
      id: `m${i}`,
      status: "SCHEDULED",
      ...draft,
    }));
    const second = planRegeneration(asExisting, drafts);
    expect(second.create).toHaveLength(drafts.length);
    expect(second.deleteIds).toHaveLength(drafts.length);
  });
});

describe("roundKickoff", () => {
  const start = new Date("2026-09-01T12:00:00Z");
  const end = new Date("2026-09-11T12:00:00Z");

  it("puts round one on the start date", () => {
    expect(roundKickoff(1, 5, start, end).toISOString()).toBe(
      start.toISOString(),
    );
  });

  it("spaces rounds evenly and stays inside the window", () => {
    const r3 = roundKickoff(3, 5, start, end);
    expect(r3.getTime()).toBeGreaterThan(start.getTime());
    expect(r3.getTime()).toBeLessThan(end.getTime());
  });

  it("collapses to the start when there is only one round", () => {
    expect(roundKickoff(1, 1, start, end).toISOString()).toBe(
      start.toISOString(),
    );
  });
});
