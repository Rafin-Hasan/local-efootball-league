"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

/**
 * Mobile navigation. The top rail hides its links below `md`, which left the
 * five main pages unreachable on a phone — this is the replacement, kept to
 * five destinations so every target stays comfortably above 44px.
 */
const ITEMS = [
  { href: "/", label: "Home", icon: "M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" },
  { href: "/fixtures", label: "Fixtures", icon: "M4 5h12v11H4zM4 8.5h12M7.5 3v3M12.5 3v3" },
  { href: "/standings", label: "Table", icon: "M3.5 16V8m5 8V4m5 12v-5" },
  { href: "/dashboard", label: "Team", icon: "M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 17c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5" },
  { href: "/stats", label: "Stats", icon: "M10 3.5 12 8l5 .7-3.6 3.4.9 4.9L10 14.7 5.7 17l.9-4.9L3 8.7 8 8z" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="rail fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-1 transition",
                  active ? "text-aqua-300" : "text-ink-500",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-aqua-500"
                  />
                ) : null}
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                <span className="text-[10.5px] font-semibold">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
