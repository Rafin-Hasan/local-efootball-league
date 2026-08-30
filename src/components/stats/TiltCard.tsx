"use client";

import { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Avatar, FormPills } from "@/components/ui/Page";
import { FlameIcon, StarIcon } from "@/components/ui/icons";
import { clsx } from "@/lib/clsx";
import type { AxisKey, RadarAxis } from "@/lib/engine/profile";

/**
 * The dossier card: a pointer-tracked 3D tilt with a caustic glare that follows
 * the cursor, matching the water theme.
 *
 * Tilt is applied to a wrapper via inline transform rather than Framer Motion,
 * because this updates on every pointermove and going through React state for
 * a spring would re-render the subtree ~60 times a second for a purely visual
 * effect. Tilt is disabled entirely under reduced motion and on coarse
 * pointers, where there is no hover to track anyway.
 */
export function TiltCard({
  name,
  club,
  rating,
  leagueRank,
  bootRank,
  ballRank,
  totalPlayers,
  form,
  axes,
  goals,
  played,
}: {
  name: string;
  club: string | null;
  rating: number;
  leagueRank: number;
  bootRank: number;
  ballRank: number;
  totalPlayers: number;
  form: ("W" | "D" | "L")[];
  axes: RadarAxis[];
  goals: number;
  played: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, on: false });

  const interactive = !reduced;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (py - 0.5) * -12, y: (px - 0.5) * 12 });
    setGlare({ x: px * 100, y: py * 100, on: true });
  }

  function reset() {
    setTilt({ x: 0, y: 0 });
    setGlare((g) => ({ ...g, on: false }));
  }

  // Rating drives the ring; 0-10 scale from the engine.
  const pct = Math.max(0, Math.min(1, rating / 10));
  const circumference = 2 * Math.PI * 34;

  return (
    <div style={{ perspective: 1100 }} className="flex justify-center">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 160ms cubic-bezier(0.16,1,0.3,1)",
          transformStyle: "preserve-3d",
        }}
        className="panel-raised specular relative w-[19rem] overflow-hidden rounded-3xl p-5"
      >
        {/* Caustic glare that follows the pointer. */}
        <div
          aria-hidden
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 155, 162,0.28), rgba(225, 29, 42,0.10) 42%, transparent 72%)`,
            opacity: glare.on ? 1 : 0,
          }}
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        />

        {/* Header: rating dial and league rank */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="relative grid place-items-center">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#tilt-arc)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct)}
              />
              <defs>
                <linearGradient id="tilt-arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF9BA2" />
                  <stop offset="100%" stopColor="#A50E19" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute grid place-items-center text-center">
              <span className="scoreboard text-2xl leading-none text-ink">
                {played === 0 ? "—" : rating.toFixed(2)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-ink-400">
                Rating
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="chip bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/40">
              <StarIcon className="h-3 w-3" />
              #{leagueRank || "—"} of {totalPlayers}
            </span>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
              League position
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="relative z-10 mt-5 flex items-center gap-3">
          <Avatar name={name} size={44} />
          <div className="min-w-0">
            <h3 className="display truncate text-2xl leading-none text-ink" title={name}>
              {name}
            </h3>
            {club ? (
              <p className="mt-1 truncate text-[12px] text-ink-500">{club}</p>
            ) : null}
          </div>
        </div>

        {/* Golden Boot ribbon */}
        <div className="relative z-10 mt-4 flex items-center justify-between rounded-xl border border-gold-400/30 bg-gold-400/10 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold-300">
            <FlameIcon className="h-3.5 w-3.5" />
            Golden Boot #{bootRank || "—"}
          </span>
          <span className="scoreboard text-sm text-ink">{goals}G</span>
        </div>

        {/* Form */}
        <div className="relative z-10 mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ink-500">Form</span>
          <FormPills form={form} size="sm" />
        </div>

        {/* Axis strip — the same six numbers as the radar */}
        <div className="relative z-10 mt-4 grid grid-cols-6 gap-1 border-t border-white/10 pt-3 text-center">
          {axes.map((a) => (
            <div key={a.key} className="flex flex-col items-center" title={`${a.label}: ${a.raw}`}>
              <span className="text-[9px] font-bold text-ink-400">{a.key}</span>
              <span
                className={clsx(
                  "scoreboard text-[13px]",
                  a.value >= a.leagueAvg ? "text-brand-300" : "text-ink-500",
                )}
              >
                {a.value}
              </span>
            </div>
          ))}
        </div>

        <p className="relative z-10 mt-2 text-center text-[10px] leading-snug text-ink-400">
          Ball #{ballRank || "—"} · {played} match{played === 1 ? "" : "es"} played
        </p>
      </div>
    </div>
  );
}

export type { AxisKey };
