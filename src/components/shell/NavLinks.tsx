"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";

/**
 * Navigation with a current-page indicator.
 *
 * The indicator is a soft frosted pill rather than a hard underline: a sharp
 * 2px rule fights the glass, where a rounded lozenge with a gold-tipped sheen
 * sits inside the material. A shared `layoutId` glides it between links, so
 * moving through the app reads as one continuous object rather than a blink.
 */
export function NavLinks({
  links,
}: {
  links: { href: string; label: string; accent?: boolean }[];
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <ul className="relative z-10 hidden min-w-0 flex-1 items-center gap-0.5 md:flex">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative block rounded-2xl px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
                active
                  ? "text-ink"
                  : link.accent
                    ? "text-gold-300 hover:bg-white/[0.12]"
                    : "text-ink-600 hover:bg-white/[0.12] hover:text-ink",
              )}
            >
              {active ? (
                <motion.span
                  aria-hidden
                  layoutId="nav-active"
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
              <span className="relative z-10">{link.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
