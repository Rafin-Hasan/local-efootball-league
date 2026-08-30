import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginCard } from "@/components/auth/LoginCard";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

const RACES = [
  ["Golden Boot", "Top scorer"],
  ["Golden Ball", "Best rating"],
  ["Winner Race", "Team points"],
];

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
    /*
     * A single centred modal rather than the previous two-column split. The
     * window floats free in an ambient field: light pools behind it, the
     * caustic layer from the root layout drifts underneath, and the glass
     * refracts both. One column also means one reading path, which is what
     * keeps a sign-in screen from feeling cluttered.
     */
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      {/* Ambient lighting. Wide, soft and low-opacity — these read as light in
          the room, not as coloured shapes. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand-500/12 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[8%] h-[26rem] w-[26rem] rounded-full bg-brand-700/14 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[6%] h-[22rem] w-[22rem] rounded-full bg-gold-500/8 blur-[110px]" />
      </div>

      <div className="relative w-full max-w-[29rem]">
        {/* Brand, above the window rather than beside it */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <LogoMark size={64} priority />
          <Wordmark className="text-xl" />
        </div>

        <div className="modal gloss relative overflow-hidden rounded-[1.9rem] p-6 sm:p-8">
          <div className="relative z-10">
            <h1 className="display text-4xl leading-none text-ink">Sign in</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">
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
        </div>

        {/* The three races, as a slim strip under the window: enough to say what
            the league is, without turning the screen into a landing page. */}
        <ul className="mt-6 grid grid-cols-3 gap-2">
          {RACES.map(([term, desc]) => (
            <li key={term} className="control rounded-2xl px-3 py-2.5 text-center">
              <span className="display block text-[13px] leading-tight text-ink">
                {term}
              </span>
              <span className="mt-0.5 block text-[11px] leading-tight text-ink-500">
                {desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
