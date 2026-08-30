"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";

/**
 * Mobile navigation. The top rail hides its links below `md`, which left the
 * five main pages unreachable on a phone — this is the replacement, kept to
 * five destinations so every target stays comfortably above 44px.
 *
 * Same floating capsule as the top rail: detached from the screen edge, soft
 * radius, glossy lip, with the safe-area inset applied outside the glass so
 * the capsule never sits under the home indicator.
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
  const reduced = useReducedMotion();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <nav
        aria-label="Primary"
        className="rail gloss relative mx-auto max-w-lg overflow-hidden rounded-[1.65rem]"
      >
        <ul className="relative z-10 flex items-stretch justify-around px-1.5 py-1">
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
                    "relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl px-1",
                    active ? "text-ink" : "text-ink-600",
                  )}
                >
                  {active ? (
                    <motion.span
                      aria-hidden
                      layoutId="bottom-nav-active"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 32 }
                      }
                      className="absolute inset-0 rounded-2xl border border-white/25
                                 bg-gradient-to-b from-white/[0.22] to-white/[0.06]
                                 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),inset_0_-1px_0_0_rgba(245,197,66,0.28)]"
                    />
                  ) : null}

                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="relative z-10 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                  <span className="relative z-10 text-[10.5px] font-semibold">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
