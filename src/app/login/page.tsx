import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginCard } from "@/components/auth/LoginCard";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { invite?: string; tab?: string };
}) {
  if (await getSession()) redirect("/");

  // Offered on the Admin tab so an admin who closed the browser can get back
  // into a tournament they already created.
  const tournaments = await db.tournament.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      _count: { select: { players: true } },
    },
  });

  const existing = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    playerCount: t._count.players,
    startDate: t.startDate.toISOString().slice(0, 10),
    endDate: t.endDate.toISOString().slice(0, 10),
  }));

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — a shade deeper than the page, so the split reads as two
          surfaces rather than one flat field. */}
      <aside className="relative hidden overflow-hidden border-r border-white/10 bg-deep-950 px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full
                     bg-aqua-500/15 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-[24rem] w-[24rem] rounded-full
                     bg-brand-700/20 blur-[110px]"
        />

        <LogoMark size={112} priority />

        <div className="relative max-w-md">
          <h1 className="display text-6xl leading-[0.92] text-white">
            Run your league
            <br />
            <span className="text-brand-500">like a pro.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            KickOff OS is the operating system for the Local eFootball League —
            fixtures, live standings, player ratings and an AI match copilot in
            one control room.
          </p>
        </div>

        <dl className="panel-over relative grid grid-cols-3 gap-6 rounded-2xl px-5 py-5">
          {[
            ["Golden Boot", "Top scorer race"],
            ["Golden Ball", "Best player rating"],
            ["Winner Race", "Team points table"],
          ].map(([term, desc]) => (
            <div key={term}>
              <dt className="display text-[15px] text-white">{term}</dt>
              <dd className="mt-1 text-[12.5px] leading-snug text-white/60">
                {desc}
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="mb-9 flex flex-col items-center gap-3 lg:hidden">
          <LogoMark size={72} priority />
          <Wordmark className="text-2xl" />
        </div>

        <div className="panel-raised specular relative w-full max-w-[27rem] rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="display text-4xl text-ink">Sign in</h2>
          <p className="mt-1.5 text-[14.5px] text-ink-500">
            Join with your player codes, or set up a new tournament.
          </p>

          <div className="mt-7">
            <LoginCard
              inviteCode={searchParams.invite}
              existing={existing}
              initialTab={searchParams.tab === "admin" ? "admin" : "player"}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
