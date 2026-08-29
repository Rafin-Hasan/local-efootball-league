"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Scroll-reveal primitives.
 *
 * One place decides the timings so the whole app moves with the same hand.
 * Every one of these collapses to a plain fade (or nothing) when the user has
 * asked for reduced motion — that is an accessibility requirement, not polish.
 *
 * Only `transform` and `opacity` are animated, so these run on the compositor.
 */

/** Rise-and-settle, the way something surfaces through water. */
const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  /** Travel distance. Set 0 for a pure fade. */
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // `once` stops it re-firing every time the section scrolls back in.
      // `amount` stays tiny on purpose: a tall block must reveal as soon as any
      // part of it enters, or it can stay invisible on a short page.
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: reduced ? 0.2 : 0.55, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggered container. Children must be <RevealItem>.
 *
 * Stagger is capped at 0.04s/child: beyond roughly eight items the tail starts
 * to feel laggy rather than choreographed.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.04,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  const variants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : 0.05,
      },
    },
  };

  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article" | "tr";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  const variants: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.2 : 0.45, ease: EASE },
    },
  };

  return (
    <Tag className={className} variants={variants}>
      {children}
    </Tag>
  );
}
