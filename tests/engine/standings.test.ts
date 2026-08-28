import { describe, expect, it } from "vitest";
import {
  buildClubStandings,
  buildPlayerStandings,
  headToHead,
  isPlayed,
  toPlayerViews,
  type MatchLike,
  type PlayerLike,
} from "@/lib/engine/standings";

const players: PlayerLike[] = [
  { id: "p1", name: "Arif", clubName: "Inter" },
  { id: "p2", name: "Bilal", clubName: "Inter" },
  { id: "p3", name: "Chowdhury", clubName: "Madrid" },
  { id: "p4", name: "Dipu", clubName: null },
];

function match(over: Partial<MatchLike> & { id: string }): MatchLike {
  return {
    round: 1,
    homePlayerId: "p1",
    awayPlayerId: "p2",
    homeGoals: null,
    awayGoals: null,
    status: "SCHEDULED",
    playedAt: null,
    ...over,
  };
}

function played(
  id: string,
  home: string,
  away: string,
  hg: number,
  ag: number,
  round = 1,
): MatchLike {
  return match({
    id,
    homePlayerId: home,
    awayPlayerId: away,
    homeGoals: hg,
    awayGoals: ag,
    status: "PLAYED",
    playedAt: new Date(`2026-09-0${round}T18:00:00Z`),
    round,
  });
}

describe("isPlayed", () => {
  it("requires both a PLAYED status and two scores", () => {
    expect(isPlayed(played("m", "p1", "p2", 1, 0))).toBe(true);
    expect(isPlayed(match({ id: "m", status: "PLAYED" }))).toBe(false);
    expect(
      isPlayed(match({ id: "m", homeGoals: 2, awayGoals: 1 })),
    ).toBe(false);
  });
});

describe("toPlayerViews", () => {
  it("produces two mirrored views per played match", () => {
    const views = toPlayerViews([played("m1", "p1", "p2", 3, 1)]);
    expect(views).toHaveLength(2);
    expect(views[0]).toMatchObject({
      playerId: "p1",
      goalsFor: 3,
      goalsAgainst: 1,
    });
    expect(views[1]).toMatchObject({
      playerId: "p2",
      goalsFor: 1,
      goalsAgainst: 3,
    });
  });

  it("ignores unplayed matches", () => {
    expect(toPlayerViews([match({ id: "m1" })])).toHaveLength(0);
  });
});

describe("buildPlayerStandings", () => {
  it("lists every player even with no matches played", () => {
    const rows = buildPlayerStandings(players, []);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it("aggregates wins, draws, goals and clean sheets", () => {
    const rows = buildPlayerStandings(players, [
      played("m1", "p1", "p2", 3, 0),
      played("m2", "p1", "p3", 1, 1, 2),
      played("m3", "p1", "p4", 0, 2, 3),
    ]);

    const arif = rows.find((r) => r.playerId === "p1")!;
    expect(arif.played).toBe(3);
    expect(arif.won).toBe(1);
    expect(arif.drawn).toBe(1);
    expect(arif.lost).toBe(1);
    expect(arif.goalsFor).toBe(4);
    expect(arif.goalsAgainst).toBe(3);
    expect(arif.goalDiff).toBe(1);
    expect(arif.points).toBe(4);
    expect(arif.cleanSheets).toBe(1);
  });

  it("orders form newest first and caps it at five", () => {
    const matches = Array.from({ length: 7 }, (_, i) =>
      played(`m${i}`, "p1", "p2", i === 6 ? 0 : 2, i === 6 ? 1 : 0, i + 1),
    );
    const rows = buildPlayerStandings(players, matches);
    const arif = rows.find((r) => r.playerId === "p1")!;
    expect(arif.form).toHaveLength(5);
    // Round 7 was a loss and must lead the form guide.
    expect(arif.form[0]).toBe("L");
  });

  it("breaks a points tie on goal difference", () => {
    const rows = buildPlayerStandings(
      [players[0], players[1]],
      [played("m1", "p1", "p2", 5, 0), played("m2", "p2", "p1", 1, 0, 2)],
    );
    // Both on 3 points; Arif's +4 beats Bilal's -4.
    expect(rows[0].playerId).toBe("p1");
  });

  it("falls back to head-to-head when points and goals are level", () => {
    const matches = [
      played("m1", "p1", "p2", 1, 0),
      played("m2", "p1", "p3", 0, 1, 2),
      played("m3", "p2", "p3", 1, 0, 3),
      played("m4", "p3", "p2", 0, 1, 4),
    ];
    const rows = buildPlayerStandings([players[1], players[2]], matches);
    // Bilal beat Chowdhury twice, so he leads on head-to-head.
    expect(rows[0].playerId).toBe("p2");
  });

  it("ignores matches referencing an unknown player", () => {
    const rows = buildPlayerStandings(
      [players[0]],
      [played("m1", "p1", "ghost", 2, 0)],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].played).toBe(1);
  });
});

describe("headToHead", () => {
  it("returns zero when the pair never met", () => {
    expect(headToHead("p1", "p4", [played("m1", "p1", "p2", 1, 0)])).toBe(0);
  });

  it("is sign-symmetric", () => {
    const matches = [played("m1", "p1", "p2", 2, 0)];
    expect(headToHead("p1", "p2", matches)).toBeLessThan(0);
    expect(headToHead("p2", "p1", matches)).toBeGreaterThan(0);
  });
});

describe("buildClubStandings", () => {
  it("rolls player points up into their club", () => {
    const rows = buildPlayerStandings(players, [
      played("m1", "p1", "p3", 2, 0),
      played("m2", "p2", "p3", 1, 0, 2),
    ]);
    const clubs = buildClubStandings(rows);
    const inter = clubs.find((c) => c.club === "Inter")!;
    expect(inter.points).toBe(6);
    expect(inter.members).toEqual(["Arif", "Bilal"]);
  });

  it("gives a club-less player their own row rather than dropping them", () => {
    const rows = buildPlayerStandings(players, [
      played("m1", "p4", "p1", 1, 0),
    ]);
    const clubs = buildClubStandings(rows);
    expect(clubs.some((c) => c.club === "Dipu")).toBe(true);
  });

  it("sorts clubs by points, then goal difference", () => {
    const rows = buildPlayerStandings(players, [
      played("m1", "p1", "p3", 4, 0),
      played("m2", "p2", "p3", 1, 0, 2),
    ]);
    const clubs = buildClubStandings(rows);
    expect(clubs[0].club).toBe("Inter");
    expect(clubs[0].goalDiff).toBe(5);
  });
});
