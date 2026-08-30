import { describe, expect, it } from "vitest";
import {
  buildClubmates,
  buildHonours,
  buildRadar,
  longestUnbeatenRun,
  playerMatches,
} from "@/lib/engine/profile";
import type { MatchLike, PlayerRow } from "@/lib/engine/standings";

function row(over: Partial<PlayerRow> & { playerId: string; name: string }): PlayerRow {
  return {
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

function match(over: Partial<MatchLike> & { id: string }): MatchLike {
  return {
    round: 1,
    homePlayerId: "a",
    awayPlayerId: "b",
    homeGoals: 1,
    awayGoals: 0,
    status: "PLAYED",
    playedAt: new Date(),
    ...over,
  };
}

describe("buildRadar", () => {
  const strong = row({
    playerId: "a",
    name: "A",
    played: 4,
    won: 4,
    goalsFor: 8,
    goalsAgainst: 0,
    goalDiff: 8,
    cleanSheets: 4,
    points: 12,
    form: ["W", "W", "W", "W"],
  });
  const weak = row({
    playerId: "b",
    name: "B",
    played: 4,
    lost: 4,
    goalsFor: 0,
    goalsAgainst: 8,
    goalDiff: -8,
    points: 0,
    form: ["L", "L", "L", "L"],
  });

  it("returns all six axes", () => {
    const axes = buildRadar(strong, [strong, weak]);
    expect(axes.map((a) => a.key)).toEqual(["ATT", "DEF", "WIN", "MAR", "CLS", "FRM"]);
  });

  it("keeps every axis inside 0-100", () => {
    for (const r of [strong, weak]) {
      for (const a of buildRadar(r, [strong, weak])) {
        expect(a.value).toBeGreaterThanOrEqual(0);
        expect(a.value).toBeLessThanOrEqual(100);
        expect(a.leagueAvg).toBeGreaterThanOrEqual(0);
        expect(a.leagueAvg).toBeLessThanOrEqual(100);
      }
    }
  });

  it("scores a perfect record above a losing one on every axis", () => {
    const s = buildRadar(strong, [strong, weak]);
    const w = buildRadar(weak, [strong, weak]);
    for (let i = 0; i < s.length; i += 1) {
      expect(s[i].value).toBeGreaterThan(w[i].value);
    }
  });

  it("gives a shutout record 100 for defence and clean sheets", () => {
    const axes = buildRadar(strong, [strong, weak]);
    expect(axes.find((a) => a.key === "DEF")!.value).toBe(100);
    expect(axes.find((a) => a.key === "CLS")!.value).toBe(100);
  });

  it("puts a level goal difference at the midpoint of the margin axis", () => {
    const level = row({
      playerId: "c", name: "C", played: 2, drawn: 2,
      goalsFor: 2, goalsAgainst: 2, goalDiff: 0, points: 2, form: ["D", "D"],
    });
    expect(buildRadar(level, [level]).find((a) => a.key === "MAR")!.value).toBe(50);
  });

  it("zeroes every axis for a player with no matches", () => {
    const none = row({ playerId: "d", name: "D" });
    expect(buildRadar(none, [none]).every((a) => a.value === 0)).toBe(true);
  });

  it("excludes players with no matches from the league benchmark", () => {
    const none = row({ playerId: "d", name: "D" });
    const withIdle = buildRadar(strong, [strong, weak, none]);
    const withoutIdle = buildRadar(strong, [strong, weak]);
    expect(withIdle.map((a) => a.leagueAvg)).toEqual(
      withoutIdle.map((a) => a.leagueAvg),
    );
  });
});

describe("longestUnbeatenRun", () => {
  const g = (gf: number, ga: number, round = 1) => ({ goalsFor: gf, goalsAgainst: ga, round, opponent: "x" });

  it("is zero with no matches", () => {
    expect(longestUnbeatenRun([])).toBe(0);
  });

  it("counts draws as unbeaten", () => {
    expect(longestUnbeatenRun([g(1, 1), g(2, 0), g(0, 0)])).toBe(3);
  });

  it("resets on a defeat and reports the longest run, not the last", () => {
    expect(longestUnbeatenRun([g(1, 0), g(2, 0), g(3, 0), g(0, 1), g(1, 0)])).toBe(3);
  });
});

describe("playerMatches", () => {
  const matches = [
    match({ id: "m1", round: 1, homePlayerId: "a", awayPlayerId: "b", homeGoals: 3, awayGoals: 1 }),
    match({ id: "m2", round: 2, homePlayerId: "b", awayPlayerId: "a", homeGoals: 2, awayGoals: 0 }),
    match({ id: "m3", round: 3, homePlayerId: "a", awayPlayerId: "b", status: "SCHEDULED", homeGoals: null, awayGoals: null }),
    match({ id: "m4", round: 1, homePlayerId: "c", awayPlayerId: "d", homeGoals: 1, awayGoals: 1 }),
  ];
  const nameOf = (id: string) => id.toUpperCase();

  it("orients each match to the player and skips unplayed ones", () => {
    const games = playerMatches("a", matches, nameOf);
    expect(games).toHaveLength(2);
    expect(games[0]).toMatchObject({ goalsFor: 3, goalsAgainst: 1, opponent: "B" });
    // Player A was away in round 2, so the scoreline flips.
    expect(games[1]).toMatchObject({ goalsFor: 0, goalsAgainst: 2, opponent: "B" });
  });

  it("ignores matches the player was not in", () => {
    expect(playerMatches("a", matches, nameOf).some((g) => g.opponent === "D")).toBe(false);
  });
});

describe("buildHonours", () => {
  const ranks = { boot: 1, ball: 1, league: 1, total: 8 };
  const games = [
    { goalsFor: 3, goalsAgainst: 0, round: 1, opponent: "B" },
    { goalsFor: 5, goalsAgainst: 1, round: 2, opponent: "C" },
    { goalsFor: 1, goalsAgainst: 1, round: 3, opponent: "D" },
  ];
  const r = row({
    playerId: "a", name: "A", played: 3, won: 2, drawn: 1,
    goalsFor: 9, goalsAgainst: 2, goalDiff: 7, cleanSheets: 1, points: 7,
    form: ["D", "W", "W"],
  });

  it("awards the boot and ball only at rank 1", () => {
    const first = buildHonours(r, games, ranks).map((h) => h.id);
    expect(first).toContain("boot");
    expect(first).toContain("ball");

    const second = buildHonours(r, games, { ...ranks, boot: 2, ball: 2 }).map((h) => h.id);
    expect(second).not.toContain("boot");
    expect(second).not.toContain("ball");
  });

  it("counts hat-tricks as 3+ goals in a match", () => {
    const hat = buildHonours(r, games, ranks).find((h) => h.id === "hat");
    expect(hat?.name).toBe("2 hat-tricks");
  });

  it("reports the biggest win by margin, not by goals scored", () => {
    const big = buildHonours(r, games, ranks).find((h) => h.id === "big");
    expect(big?.pill).toBe("+4");
    expect(big?.detail).toContain("C");
  });

  it("ignores a one-goal win, which every player has", () => {
    const narrow = [{ goalsFor: 1, goalsAgainst: 0, round: 1, opponent: "B" }];
    expect(buildHonours(r, narrow, ranks).some((h) => h.id === "big")).toBe(false);

    const clear = [{ goalsFor: 2, goalsAgainst: 0, round: 1, opponent: "B" }];
    expect(buildHonours(r, clear, ranks).some((h) => h.id === "big")).toBe(true);
  });

  it("only claims an unbeaten run at three or more", () => {
    expect(buildHonours(r, games, ranks).some((h) => h.id === "run")).toBe(true);
    const short = games.slice(0, 2);
    expect(buildHonours(r, short, ranks).some((h) => h.id === "run")).toBe(false);
  });

  it("returns nothing for an unplayed, unranked player", () => {
    const none = row({ playerId: "z", name: "Z" });
    expect(buildHonours(none, [], { boot: 8, ball: 8, league: 8, total: 8 })).toEqual([]);
  });
});

describe("buildClubmates", () => {
  const league = [
    { ...row({ playerId: "a", name: "A", clubName: "Roma", played: 2, points: 6 }), rating: 7 },
    { ...row({ playerId: "b", name: "B", clubName: "Roma", played: 2, points: 3 }), rating: 6 },
    { ...row({ playerId: "c", name: "C", clubName: "Ajax", played: 2, points: 1 }), rating: 5 },
  ];
  const matches = [
    match({ id: "m1", round: 1, homePlayerId: "a", awayPlayerId: "b", homeGoals: 2, awayGoals: 1 }),
    match({ id: "m2", round: 2, homePlayerId: "b", awayPlayerId: "a", homeGoals: 3, awayGoals: 0 }),
  ];

  it("returns same-club players only, excluding the player themselves", () => {
    const mates = buildClubmates({ id: "a", clubName: "Roma", name: "A" }, league, matches);
    expect(mates.map((m) => m.playerId)).toEqual(["b"]);
  });

  it("computes the head-to-head from the player's point of view", () => {
    const [b] = buildClubmates({ id: "a", clubName: "Roma", name: "A" }, league, matches);
    expect(b.head).toEqual({ played: 2, won: 1, drawn: 0, lost: 1 });
  });

  it("falls back to the player's own name when no club is set", () => {
    const solo = [
      { ...row({ playerId: "x", name: "X" }), rating: 5 },
      { ...row({ playerId: "y", name: "X" }), rating: 5 },
    ];
    const mates = buildClubmates({ id: "x", clubName: null, name: "X" }, solo, []);
    expect(mates.map((m) => m.playerId)).toEqual(["y"]);
  });
});
