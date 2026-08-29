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

export function TopNav({ session }: { session: Session }) {
  const label = session.role === "admin" ? "Admin" : session.name;

  return (
    <>
    <header className="rail sticky top-0 z-40">
      <ScrollProgress />
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
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

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-aqua-500 text-[11px] font-bold text-deep-950">
              {session.role === "admin" ? "AD" : initials(session.name)}
            </span>
            <span className="text-[13.5px] font-semibold text-ink-700">
              {label}
            </span>
          </span>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl px-2.5 py-2 text-[13px] font-semibold text-ink-500 transition hover:bg-deep-700 hover:text-aqua-300"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
    <BottomNav />
    </>
  );
}
