import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Copilot } from "@/components/admin/Copilot";
import { RosterPanel } from "@/components/admin/RosterPanel";
import { FixtureGenerator, ScoreEntry } from "@/components/admin/ScorePanel";
import { PageHeader, PageShell, StatTile } from "@/components/ui/Page";
import { getSession } from "@/lib/auth/session";
import { getAdminData } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin" };

/** Absolute origin for shareable invite links, from the proxy headers. */
function requestOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Middleware already gates this route; re-check so the page is safe on its own.
  if (session.role !== "admin") redirect("/");

  const data = await getAdminData(session.tournamentId);
  if (!data) redirect("/api/auth/signout?reason=stale");

  const remaining = data.matchCount - data.playedCount;

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Control room"
          title="Admin"
          lead={`Everything that changes the league lives here: the roster and their codes, the fixture generator, score entry, and the AI copilot.`}
        />

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Players" value={data.playerCount} />
          <StatTile label="Gameweeks" value={data.rounds.length} />
          <StatTile
            label="Played"
            value={data.playedCount}
            sub={`of ${data.matchCount}`}
            accent="win"
          />
          <StatTile label="Outstanding" value={remaining} accent="brand" />
        </div>

        <div className="space-y-5">
          <Copilot />
          <FixtureGenerator hasFixtures={data.matchCount > 0} />
          <ScoreEntry rounds={data.rounds} />
          <RosterPanel roster={data.roster} origin={requestOrigin()} />
        </div>
      </PageShell>
    </>
  );
}
