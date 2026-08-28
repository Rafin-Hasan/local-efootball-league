"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/clsx";

export type RaceItem = {
  id: string;
  name: string;
  /** Club, member list, or any secondary line. */
  sub?: string | null;
  value: number;
  /** Rendered under the value, e.g. "goals" or "pts". */
  unit: string;
  /** Trailing W/D/L pills, newest first. */
  form?: ("W" | "D" | "L")[];
  meta?: string;
};

type Accent = "gold" | "brand" | "ink";

const ACCENT: Record<
  Accent,
  { bar: string; ring: string; chip: string; glow: string }
> = {
  gold: {
    bar: "bg-gradient-to-r from-gold-400 to-gold-600",
    ring: "ring-gold-400/40",
    chip: "bg-gold-400/25 text-gold-600 ring-1 ring-gold-400/40",
    glow: "shadow-[0_10px_30px_-12px_rgba(224,168,30,0.55)]",
  },
  brand: {
    bar: "bg-gradient-to-r from-brand-400 to-brand-600",
    ring: "ring-brand-400/40",
    chip: "bg-brand-500/15 text-brand-700 ring-1 ring-brand-400/40",
    glow: "shadow-[0_10px_30px_-12px_rgba(225,29,42,0.55)]",
  },
  ink: {
    bar: "bg-gradient-to-r from-ink-600 to-ink",
    ring: "ring-ink-300",
    chip: "bg-ink/10 text-ink-700 ring-1 ring-ink-300",
    glow: "shadow-[0_10px_30px_-12px_rgba(11,11,13,0.45)]",
  },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const FORM_TITLE = { W: "Win", D: "Draw", L: "Loss" } as const;

export function RaceSlider({
  title,
  subtitle,
  items,
  accent = "brand",
  emptyMessage = "No results yet — the race begins at the first kickoff.",
}: {
  title: string;
  subtitle: string;
  items: RaceItem[];
  accent?: Accent;
  emptyMessage?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const tone = ACCENT[accent];

  // The leader defines a full bar; a zeroed board shows empty bars, not NaN.
  const leader = items.length ? Math.max(...items.map((i) => i.value)) : 0;

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    syncEdges();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncEdges, items.length]);

  const nudge = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * (el.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  return (
    <section className="min-w-0">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="display text-2xl text-ink sm:text-3xl">{title}</h3>
          <p className="mt-0.5 truncate text-[13.5px] text-ink-500">
            {subtitle}
          </p>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <ArrowButton
            direction="left"
            disabled={edges.start}
            onClick={() => nudge(-1)}
          />
          <ArrowButton
            direction="right"
            disabled={edges.end}
            onClick={() => nudge(1)}
          />
        </div>
      </header>

      {items.length === 0 ? (
        <div className="card grid h-40 place-items-center px-6 text-center text-[13.5px] text-ink-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={syncEdges}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, index) => (
              <RaceCard
                key={item.id}
                item={item}
                rank={index + 1}
                leader={leader}
                tone={tone}
                delay={index * 0.05}
              />
            ))}
          </div>

          {/* Fades hint that the track keeps going. */}
          <Fade side="left" hidden={edges.start} />
          <Fade side="right" hidden={edges.end} />
        </div>
      )}
    </section>
  );
}

function RaceCard({
  item,
  rank,
  leader,
  tone,
  delay,
}: {
  item: RaceItem;
  rank: number;
  leader: number;
  tone: (typeof ACCENT)[Accent];
  delay: number;
}) {
  const pct = leader > 0 ? Math.round((item.value / leader) * 100) : 0;
  const podium = rank <= 3;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "card specular w-[16.5rem] shrink-0 snap-start p-4 transition",
        podium && `ring-1 ${tone.ring} ${tone.glow}`,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "grid h-7 w-7 place-items-center rounded-lg text-[12px] font-bold tabular-nums",
              podium ? tone.chip : "bg-white/60 text-ink-500 ring-1 ring-white/70",
            )}
          >
            {podium ? MEDALS[rank - 1] : rank}
          </span>
          {item.meta ? (
            <span className="chip bg-white/55 text-ink-500 ring-1 ring-white/70">{item.meta}</span>
          ) : null}
        </div>

        <div className="text-right">
          <div className="display text-3xl leading-none tabular-nums text-ink">
            {item.value}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {item.unit}
          </div>
        </div>
      </div>

      <h4
        className="mt-3 truncate text-[15px] font-semibold text-ink"
        title={item.name}
      >
        {item.name}
      </h4>
      {item.sub ? (
        <p className="truncate text-[12.5px] text-ink-500" title={item.sub}>
          {item.sub}
        </p>
      ) : null}

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10 shadow-[inset_0_1px_1px_rgba(11,11,13,0.12)]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: delay + 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={clsx("h-full rounded-full", tone.bar)}
        />
      </div>

      {item.form && item.form.length > 0 ? (
        <div className="mt-3 flex gap-1" aria-label="Recent form, newest first">
          {item.form.map((result, i) => (
            <span
              key={i}
              title={FORM_TITLE[result]}
              className={clsx(
                "grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-white",
                result === "W" && "bg-emerald-500",
                result === "D" && "bg-ink-400",
                result === "L" && "bg-brand-500",
              )}
            >
              {result}
            </span>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Scroll back" : "Scroll forward"}
      className="glass grid h-8 w-8 place-items-center rounded-xl text-ink-600 transition hover:text-ink disabled:opacity-30"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path
          d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Fade({ side, hidden }: { side: "left" | "right"; hidden: boolean }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-y-0 w-12 transition-opacity duration-200",
        side === "left"
          ? "left-0 bg-gradient-to-r from-ink-50 to-transparent"
          : "right-0 bg-gradient-to-l from-ink-50 to-transparent",
        hidden && "opacity-0",
      )}
    />
  );
}
