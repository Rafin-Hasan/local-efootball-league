import Link from "next/link";
import { redirect } from "next/navigation";
import { Countdown } from "@/components/home/Countdown";
import { HeroVideo } from "@/components/home/HeroVideo";
import { RaceSlider, type RaceItem } from "@/components/home/RaceSlider";
import { Reveal } from "@/components/motion/Reveal";
import { RulesBanner } from "@/components/home/RulesBanner";
import { getSession } from "@/lib/auth/session";
import { getLeagueOverview } from "@/lib/queries";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const overview = await getLeagueOverview(session.tournamentId);
  // Session is signed but its tournament is gone — clear it, do not loop.
  if (!overview) redirect("/api/auth/signout?reason=stale");

  const { tournament, standings, goldenBoot, goldenBall, clubRace } = overview;

  const bootItems: RaceItem[] = goldenBoot.map((row) => ({
    id: row.playerId,
    name: row.name,
    sub: row.clubName,
    value: row.goalsFor,
    unit: "goals",
    meta: `${row.played} MP`,
  }));

  const ballItems: RaceItem[] = goldenBall.map((row) => ({
    id: row.playerId,
    name: row.name,
    sub: row.clubName,
    value: row.rating,
    unit: "rating",
    form: row.form,
  }));

  const clubItems: RaceItem[] = clubRace.map((row) => ({
    id: row.club,
    name: row.club,
    sub:
      row.members.length > 1
        ? `${row.members.length} players`
        : row.members[0],
    value: row.points,
    unit: "pts",
    meta: `${row.won}W ${row.drawn}D ${row.lost}L`,
  }));

  return (
    <>

      <HeroVideo>
        <p className="panel-over chip text-white">
          {overview.playedCount} of {overview.matchCount} matches played
        </p>

        <h1 className="display mt-4 max-w-3xl text-5xl leading-[0.92] text-white sm:text-7xl">
          {tournament.name}
        </h1>

        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
          Every 1v1 counts. Goals feed the Golden Boot, performances feed the
          Golden Ball, and points climb straight into the team table.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/fixtures" className="btn-primary">
            View fixtures
          </Link>
          <Link
            href="/standings"
            className="panel-over btn text-white transition hover:bg-white/[0.10]"
          >
            Live standings
          </Link>
        </div>
      </HeroVideo>

      <main className="mx-auto w-full max-w-6xl px-6 pb-28 md:pb-24">
        <RulesBanner
          className="relative z-10 -mt-12"
          name={tournament.name}
          startDate={tournament.startDate}
          endDate={tournament.endDate}
          rules={tournament.rules}
          playerCount={overview.playerCount}
        />

        <Reveal className="card specular mt-10 p-6 sm:p-7">
          <Countdown endsAt={tournament.endDate.toISOString()} />
        </Reveal>

        <div className="mt-14 space-y-14">
          <Reveal>
          <RaceSlider
            title="Golden Boot race"
            subtitle="Most goals scored across all 1v1 fixtures"
            accent="gold"
            items={bootItems}
            emptyMessage="No goals yet. The Golden Boot opens at the first kickoff."
          />
          </Reveal>

          <Reveal>
          <RaceSlider
            title="Golden Ball race"
            subtitle="Best overall rating — wins, goal difference and clean sheets, weighted by appearances"
            accent="brand"
            items={ballItems}
            emptyMessage="Ratings appear once players have matches on record."
          />
          </Reveal>

          <Reveal>
          <RaceSlider
            title="Winner race"
            subtitle="Team points, aggregated from every player's 1v1 results"
            accent="ink"
            items={clubItems}
            emptyMessage="The team table fills up as results come in."
          />
          </Reveal>
        </div>

        {standings.length > 0 && overview.playedCount === 0 ? (
          <p className="panel mt-12 rounded-2xl px-5 py-4 text-center text-[13.5px] text-ink-500">
            {overview.playerCount} players are registered and no matches have
            been played yet. Every board above is live and will fill in the
            moment scores are submitted.
          </p>
        ) : null}
      </main>
    </>
  );
}
