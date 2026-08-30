import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { BottomNav } from "@/components/shell/BottomNav";
import { NavLinks } from "@/components/shell/NavLinks";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import type { Session } from "@/lib/auth/session";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/standings", label: "Standings" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stats", label: "My Stats" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The navigation floats as a rounded glass capsule rather than sitting in a
 * full-bleed bar. Detaching it from the page edge is what gives the chrome its
 * own layer: the caustic field slides underneath as you scroll, and the capsule
 * refracts it. No hard border, no harsh shadow — a soft ambient bloom instead.
 */
export function TopNav({ session }: { session: Session }) {
  const label = session.role === "admin" ? "Admin" : session.name;

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pb-2 pt-3 sm:px-5 sm:pt-4">
        <div className="rail gloss relative mx-auto flex h-16 w-full max-w-6xl items-center gap-5 overflow-hidden rounded-[1.65rem] px-4 sm:px-6">
          <ScrollProgress />

          <Link
            href="/"
            className="relative z-10 flex shrink-0 items-center gap-2.5 rounded-2xl"
          >
            <LogoMark size={32} />
            <Wordmark className="hidden text-lg sm:inline-flex" />
          </Link>

          <NavLinks
            links={[
              ...LINKS,
              ...(session.role === "admin"
                ? [{ href: "/admin", label: "Admin", accent: true }]
                : []),
            ]}
          />

          <div className="relative z-10 ml-auto flex items-center gap-2.5">
            <span className="hidden items-center gap-2.5 sm:flex">
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br
                           from-brand-200 to-brand-300 text-[11px] font-bold text-deep-950
                           ring-1 ring-gold-300/45"
              >
                {session.role === "admin" ? "AD" : initials(session.name)}
              </span>
              <span className="text-[13.5px] font-semibold text-ink-700">
                {label}
              </span>
            </span>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-2xl px-3 py-2 text-[13px] font-semibold text-ink-600
                           transition hover:bg-white/[0.14] hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <BottomNav />
    </>
  );
}
