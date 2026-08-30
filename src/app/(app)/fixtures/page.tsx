import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FixtureBoard } from "@/components/fixtures/FixtureBoard";
import { PageHeader, PageShell, StatTile } from "@/components/ui/Page";
import { getSession } from "@/lib/auth/session";
import { getFixtureRounds } from "@/lib/queries";

export const metadata: Metadata = { title: "Fixtures" };

export default async function FixturesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getFixtureRounds(session.tournamentId);
  if (!data) redirect("/api/auth/signout?reason=stale");

  // Default the filter to the first gameweek that still has matches to play.
  const nextRound =
    data.rounds.find((r) => r.played < r.total)?.round ??
    data.rounds[data.rounds.length - 1]?.round ??
    1;

  const remaining = data.matchCount - data.playedCount;

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Schedule"
          title="Fixtures"
          lead="Every 1v1 in the league, grouped by gameweek. Filter by round or status to find the tie you care about."
        />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Gameweeks" value={data.rounds.length} />
          <StatTile label="Fixtures" value={data.matchCount} />
          <StatTile
            label="Played"
            value={data.playedCount}
            accent="win"
            sub={`${data.matchCount === 0 ? 0 : Math.round((data.playedCount / data.matchCount) * 100)}% complete`}
          />
          <StatTile label="Remaining" value={remaining} accent="brand" />
        </div>

        <FixtureBoard
          rounds={data.rounds}
          currentRound={nextRound}
          highlightPlayer={
            session.role === "player" ? session.playerId : undefined
          }
        />
      </PageShell>
    </>
  );
}
