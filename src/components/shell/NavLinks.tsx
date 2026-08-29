"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

/**
 * Navigation with a current-page indicator. The red underline is the same
 * accent used for the leader and the live badge, so "where am I" reads with
 * the same cue as "what matters here".
 */
export function NavLinks({
  links,
}: {
  links: { href: string; label: string; accent?: boolean }[];
}) {
  const pathname = usePathname();

  return (
    <ul className="hidden min-w-0 flex-1 items-center gap-0.5 md:flex">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative rounded-lg px-3 py-2 text-[13.5px] font-semibold transition",
                active
                  ? "text-ink"
                  : link.accent
                    ? "text-aqua-300 hover:bg-deep-700"
                    : "text-ink-500 hover:bg-deep-700 hover:text-ink",
              )}
            >
              {link.label}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-aqua-500"
                />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
