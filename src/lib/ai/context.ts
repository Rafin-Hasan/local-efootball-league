import { ratingOf } from "@/lib/engine/ratings";
import type { LeagueOverview } from "@/lib/queries";

/**
 * Flatten the live league into a compact briefing for the model.
 *
 * Deliberately small and stable: the copilot answers questions about *this*
 * tournament, so the whole state fits in a prompt and there is no retrieval
 * step to get wrong. Trimmed to the top rows so a 200-player league does not
 * blow the budget.
 */
export function buildLeagueContext(overview: LeagueOverview): string {
  const { tournament } = overview;

  const table = overview.standings
    .slice(0, 20)
    .map(
      (row, i) =>
        `${i + 1}. ${row.name}${row.clubName ? ` (${row.clubName})` : ""} — ` +
        `${row.points} pts, ${row.played} played, ${row.won}W/${row.drawn}D/${row.lost}L, ` +
        `${row.goalsFor}:${row.goalsAgainst} (GD ${row.goalDiff >= 0 ? "+" : ""}${row.goalDiff}), ` +
        `${row.cleanSheets} CS, rating ${ratingOf(row).toFixed(2)}, ` +
        `form ${row.form.join("") || "—"}`,
    )
    .join("\n");

  const clubs = overview.clubRace
    .slice(0, 12)
    .map(
      (row, i) =>
        `${i + 1}. ${row.club} — ${row.points} pts, ${row.won}W/${row.drawn}D/${row.lost}L, ` +
        `GD ${row.goalDiff >= 0 ? "+" : ""}${row.goalDiff} (${row.members.join(", ")})`,
    )
    .join("\n");

  const byId = new Map(overview.players.map((p) => [p.id, p.name]));

  const recent = overview.matches
    .filter((m) => m.status === "PLAYED")
    .sort((a, b) => b.round - a.round)
    .slice(0, 15)
    .map(
      (m) =>
        `GW${m.round}: ${byId.get(m.homePlayerId) ?? "?"} ${m.homeGoals}-${m.awayGoals} ${byId.get(m.awayPlayerId) ?? "?"}`,
    )
    .join("\n");

  const upcoming = overview.matches
    .filter((m) => m.status !== "PLAYED")
    .sort((a, b) => a.round - b.round)
    .slice(0, 12)
    .map(
      (m) =>
        `GW${m.round}: ${byId.get(m.homePlayerId) ?? "?"} vs ${byId.get(m.awayPlayerId) ?? "?"}`,
    )
    .join("\n");

  return [
    `TOURNAMENT: ${tournament.name}`,
    `Window: ${tournament.startDate.toISOString().slice(0, 10)} to ${tournament.endDate.toISOString().slice(0, 10)}`,
    `Progress: ${overview.playedCount} of ${overview.matchCount} fixtures played across ${overview.rounds} gameweeks.`,
    tournament.rules.length
      ? `\nRULES:\n${tournament.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : "",
    `\nPLAYER STANDINGS (points, then GD, then goals, then head-to-head):\n${table || "No players."}`,
    `\nTEAM STANDINGS:\n${clubs || "No teams."}`,
    `\nRECENT RESULTS:\n${recent || "None played yet."}`,
    `\nUPCOMING FIXTURES:\n${upcoming || "None scheduled."}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const SYSTEM_PROMPT = `You are the tournament copilot for KickOff OS, an eFootball 1v1 league.

You are given the complete live state of one tournament. Answer questions about it, write short match or gameweek summaries, and point out what the numbers actually show.

Rules:
- Use only the data in the briefing. If something is not there, say so rather than inventing it.
- Be concise and specific. Cite real numbers and names.
- The "rating" is a 0-10 Golden Ball score built from win rate, goal difference, clean sheets and scoring rate, shrunk toward 5.0 for players with few appearances. A low rating on one match means low confidence, not a bad player.
- Write in plain prose for a league admin. No preamble, no sign-off, no markdown headers. Short paragraphs or tight bullet lists only.`;
