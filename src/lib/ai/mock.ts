import { ratingOf } from "@/lib/engine/ratings";
import type { LeagueOverview } from "@/lib/queries";

/**
 * Deterministic stand-in for the copilot when ANTHROPIC_API_KEY is absent.
 *
 * This is not pretending to be the model — it is a templated briefing built
 * from the same numbers, so the panel stays useful (and the demo never breaks)
 * on a machine with no key. The UI labels it as offline.
 */
export function mockAnswer(question: string, overview: LeagueOverview): string {
  const q = question.toLowerCase();
  const leader = overview.standings[0];
  const scorer = overview.goldenBoot[0];
  const best = overview.goldenBall[0];
  const topClub = overview.clubRace[0];

  if (overview.playedCount === 0) {
    return (
      `No matches have been played yet in ${overview.tournament.name}, so there is nothing to analyse. ` +
      `${overview.playerCount} players are registered across ${overview.matchCount} scheduled fixtures. ` +
      `Submit a score and the boards will populate immediately.`
    );
  }

  const lines: string[] = [];

  if (/scor|goal|boot/.test(q) && scorer) {
    lines.push(
      `Golden Boot: ${scorer.name} leads with ${scorer.goalsFor} goals in ${scorer.played} matches ` +
        `(${(scorer.goalsFor / Math.max(1, scorer.played)).toFixed(2)} per game).`,
    );
  }

  if (/rating|best|ball|form/.test(q) && best) {
    lines.push(
      `Golden Ball: ${best.name} tops the ratings at ${best.rating.toFixed(2)}, ` +
        `with recent form ${best.form.join("") || "—"}.`,
    );
  }

  if (/team|club|winner/.test(q) && topClub) {
    lines.push(
      `Team race: ${topClub.club} leads on ${topClub.points} points ` +
        `(${topClub.won}W/${topClub.drawn}D/${topClub.lost}L, GD ${topClub.goalDiff >= 0 ? "+" : ""}${topClub.goalDiff}).`,
    );
  }

  if (lines.length === 0 && leader) {
    lines.push(
      `${leader.name} leads the table on ${leader.points} points from ${leader.played} matches ` +
        `(GD ${leader.goalDiff >= 0 ? "+" : ""}${leader.goalDiff}, rating ${ratingOf(leader).toFixed(2)}).`,
    );
    if (scorer) {
      lines.push(
        `${scorer.name} is top scorer on ${scorer.goalsFor} goals, and ${topClub?.club ?? "no team"} leads the team race.`,
      );
    }
  }

  lines.push(
    `${overview.playedCount} of ${overview.matchCount} fixtures are complete ` +
      `(${Math.round((overview.playedCount / Math.max(1, overview.matchCount)) * 100)}%).`,
  );

  return lines.join(" ");
}

/** Templated gameweek recap used by the "summarise" preset without a key. */
export function mockRecap(overview: LeagueOverview): string {
  if (overview.playedCount === 0) {
    return "No results to recap yet — the season has not kicked off.";
  }

  const byId = new Map(overview.players.map((p) => [p.id, p.name]));
  const lastRound = Math.max(
    ...overview.matches.filter((m) => m.status === "PLAYED").map((m) => m.round),
  );

  const results = overview.matches
    .filter((m) => m.status === "PLAYED" && m.round === lastRound)
    .map(
      (m) =>
        `${byId.get(m.homePlayerId) ?? "?"} ${m.homeGoals}-${m.awayGoals} ${byId.get(m.awayPlayerId) ?? "?"}`,
    );

  const biggest = overview.matches
    .filter((m) => m.status === "PLAYED" && m.round === lastRound)
    .sort(
      (a, b) =>
        Math.abs((b.homeGoals ?? 0) - (b.awayGoals ?? 0)) -
        Math.abs((a.homeGoals ?? 0) - (a.awayGoals ?? 0)),
    )[0];

  const parts = [`Gameweek ${lastRound}: ${results.join(", ")}.`];

  if (biggest) {
    const margin = Math.abs(
      (biggest.homeGoals ?? 0) - (biggest.awayGoals ?? 0),
    );
    if (margin > 0) {
      parts.push(
        `Biggest margin was ${margin} goal${margin === 1 ? "" : "s"}: ` +
          `${byId.get(biggest.homePlayerId) ?? "?"} ${biggest.homeGoals}-${biggest.awayGoals} ${byId.get(biggest.awayPlayerId) ?? "?"}.`,
      );
    }
  }

  const leader = overview.standings[0];
  if (leader) {
    parts.push(
      `${leader.name} stays top on ${leader.points} points.`,
    );
  }

  return parts.join(" ");
}
