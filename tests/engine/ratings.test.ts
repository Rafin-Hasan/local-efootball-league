import { describe, expect, it } from "vitest";
import { goldenBallRace, goldenBootRace, ratingOf } from "@/lib/engine/ratings";
import type { PlayerRow } from "@/lib/engine/standings";

function row(over: Partial<PlayerRow> & { playerId: string }): PlayerRow {
  return {
    name: over.playerId,
    clubName: null,
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
    ...over,
  };
}

describe("ratingOf", () => {
  it("is zero for a player who has not played", () => {
    expect(ratingOf(row({ playerId: "p1" }))).toBe(0);
  });

  it("stays inside 0 and 10 even for absurd scorelines", () => {
    const monster = row({
      playerId: "p1",
      played: 20,
      won: 20,
      goalsFor: 400,
      goalDiff: 400,
      cleanSheets: 20,
    });
    const rating = ratingOf(monster);
    expect(rating).toBeGreaterThan(5);
    expect(rating).toBeLessThanOrEqual(10);
  });

  it("rates a winner above a loser with the same appearances", () => {
    const winner = row({
      playerId: "w",
      played: 6,
      won: 5,
      lost: 1,
      goalsFor: 12,
      goalsAgainst: 4,
      goalDiff: 8,
      cleanSheets: 3,
    });
    const loser = row({
      playerId: "l",
      played: 6,
      won: 1,
      lost: 5,
      goalsFor: 4,
      goalsAgainst: 12,
      goalDiff: -8,
      cleanSheets: 0,
    });
    expect(ratingOf(winner)).toBeGreaterThan(ratingOf(loser));
  });

  it("shrinks a one-match record toward the baseline", () => {
    const onePerfect = row({
      playerId: "a",
      played: 1,
      won: 1,
      goalsFor: 3,
      goalDiff: 3,
      cleanSheets: 1,
    });
    const tenPerfect = row({
      playerId: "b",
      played: 10,
      won: 10,
      goalsFor: 30,
      goalDiff: 30,
      cleanSheets: 10,
    });
    // Same per-match profile; the larger sample must be trusted more.
    expect(ratingOf(tenPerfect)).toBeGreaterThan(ratingOf(onePerfect));
  });

  it("is deterministic", () => {
    const r = row({ playerId: "p", played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 7, goalsAgainst: 5, goalDiff: 2, cleanSheets: 1 });
    expect(ratingOf(r)).toBe(ratingOf(r));
  });

  it("caps a single rout so it cannot dominate the rating", () => {
    const routs = row({
      playerId: "a",
      played: 2,
      won: 2,
      goalsFor: 20,
      goalDiff: 20,
      cleanSheets: 2,
    });
    const narrow = row({
      playerId: "b",
      played: 2,
      won: 2,
      goalsFor: 6,
      goalsAgainst: 0,
      goalDiff: 6,
      cleanSheets: 2,
    });
    // Both cap out on goal difference, so the gap stays small.
    expect(ratingOf(routs) - ratingOf(narrow)).toBeLessThan(0.5);
  });
});

describe("goldenBootRace", () => {
  it("ranks by goals, then by fewer matches used", () => {
    const ranked = goldenBootRace([
      row({ playerId: "a", name: "A", played: 5, goalsFor: 9 }),
      row({ playerId: "b", name: "B", played: 3, goalsFor: 9 }),
      row({ playerId: "c", name: "C", played: 5, goalsFor: 12 }),
    ]);
    expect(ranked.map((r) => r.playerId)).toEqual(["c", "b", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      row({ playerId: "a", goalsFor: 1 }),
      row({ playerId: "b", goalsFor: 9 }),
    ];
    goldenBootRace(input);
    expect(input[0].playerId).toBe("a");
  });
});

describe("goldenBallRace", () => {
  it("attaches a rating and sorts best first", () => {
    const ranked = goldenBallRace([
      row({ playerId: "a", name: "A", played: 4, lost: 4, goalsAgainst: 8, goalDiff: -8 }),
      row({ playerId: "b", name: "B", played: 4, won: 4, goalsFor: 8, goalDiff: 8, cleanSheets: 4 }),
    ]);
    expect(ranked[0].playerId).toBe("b");
    expect(ranked[0].rating).toBeGreaterThan(ranked[1].rating);
  });

  it("breaks a rating tie on appearances, then name", () => {
    const ranked = goldenBallRace([
      row({ playerId: "a", name: "Zed", played: 0 }),
      row({ playerId: "b", name: "Ada", played: 0 }),
    ]);
    expect(ranked.map((r) => r.name)).toEqual(["Ada", "Zed"]);
  });
});
