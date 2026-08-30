"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import type { RadarAxis } from "@/lib/engine/profile";

/**
 * Six-axis radar with the league benchmark underneath.
 *
 * Every axis is a real measurement of the 1v1 record (see engine/profile.ts) —
 * there is no shot or possession data in this app, so there are no invented
 * FIFA-style attributes here. The dashed polygon is the league average
 * computed by the identical formula, so "above the line" is exact.
 */
export function RadarChart({ axes }: { axes: RadarAxis[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const size = 300;
  const c = size / 2;
  const radius = 104;
  const n = axes.length;

  const point = (i: number, value: number) => {
    const angle = ((Math.PI * 2) / n) * i - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: c + r * Math.cos(angle), y: c + r * Math.sin(angle) };
  };

  const poly = (pick: (a: RadarAxis) => number) =>
    axes.map((a, i) => { const p = point(i, pick(a)); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");

  const playerPoly = poly((a) => a.value);
  const leaguePoly = poly((a) => a.leagueAvg);
  const hasData = axes.some((a) => a.value > 0);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[19rem] overflow-visible">
        {/* Concentric rings */}
        {[0.25, 0.5, 0.75, 1].map((lvl, i) => (
          <polygon
            key={lvl}
            points={poly(() => lvl * 100)}
            fill={i === 3 ? "rgba(255,255,255,0.02)" : "none"}
            stroke="rgba(191,234,246,0.12)"
            strokeWidth="1"
            strokeDasharray={i < 3 ? "3 4" : undefined}
          />
        ))}

        {/* Spokes */}
        {axes.map((_, i) => {
          const p = point(i, 100);
          return (
            <line key={i} x1={c} y1={c} x2={p.x} y2={p.y} stroke="rgba(191,234,246,0.12)" strokeWidth="1" />
          );
        })}

        {/* League benchmark */}
        <polygon
          points={leaguePoly}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(169,193,207,0.55)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />

        {/* This player */}
        <motion.polygon
          points={playerPoly}
          fill="rgba(225, 29, 42,0.24)"
          stroke="#FF5A67"
          strokeWidth="2.5"
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${c}px ${c}px` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Vertices */}
        {axes.map((a, i) => {
          const p = point(i, a.value);
          const on = active === i;
          return (
            <g key={a.key}>
              {on ? (
                <circle cx={p.x} cy={p.y} r={11} fill="none" stroke="#FF5A67" strokeWidth="1.5" opacity="0.5" />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 6.5 : 4.5}
                fill={on ? "#FF9BA2" : "#E11D2A"}
                stroke="#0C0A0B"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            </g>
          );
        })}

        {/* Axis keys */}
        {axes.map((a, i) => {
          const p = point(i, 128);
          return (
            <text
              key={a.key}
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={clsx(
                "cursor-pointer text-[11px] font-bold transition-colors",
                active === i ? "fill-brand-300" : "fill-[#A79C9E]",
              )}
            >
              {a.key}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-400 ring-2 ring-brand-400/25" />
          This player
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-ink-500 bg-white/10" />
          League average
        </span>
      </div>

      {/* Inspector */}
      <div className="mt-4 min-h-[4.5rem] w-full">
        {!hasData ? (
          <p className="well rounded-xl px-4 py-3 text-center text-[12.5px] text-ink-500">
            No matches played yet, so there is nothing to plot.
          </p>
        ) : active !== null ? (
          <div className="rounded-xl border border-brand-400/30 bg-brand-500/10 px-4 py-3 text-center">
            <div className="text-[13px] font-bold text-ink">
              {axes[active].label}
              <span className="ml-2 scoreboard text-brand-300">{axes[active].value}</span>
            </div>
            <div className="mt-0.5 text-[11.5px] text-ink-500">{axes[active].detail}</div>
            <div className="mt-1 text-[11.5px] font-semibold text-brand-300">
              {axes[active].raw} ·{" "}
              {axes[active].value === axes[active].leagueAvg
                ? "level with the league"
                : `${Math.abs(axes[active].value - axes[active].leagueAvg)} ${
                    axes[active].value > axes[active].leagueAvg ? "above" : "below"
                  } average`}
            </div>
          </div>
        ) : (
          <p className="well rounded-xl px-4 py-3 text-center text-[12px] text-ink-400">
            Hover a point to see what it measures.
          </p>
        )}
      </div>
    </div>
  );
}

/** Horizontal bars for the same six axes, with the benchmark marked. */
export function AxisBars({ axes }: { axes: RadarAxis[] }) {
  const reduced = useReducedMotion();

  return (
    <ul className="space-y-3">
      {axes.map((a, i) => (
        <li key={a.key} className="well rounded-xl p-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-bold text-ink">{a.label}</span>
            <span className="flex items-center gap-2 text-[11px] text-ink-500">
              <span className="tabular-nums">avg {a.leagueAvg}</span>
              <span className="scoreboard rounded-md bg-brand-500/15 px-2 py-0.5 text-[12px] text-brand-300">
                {a.value}
              </span>
            </span>
          </div>

          <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700"
              initial={reduced ? false : { width: 0 }}
              whileInView={{ width: `${a.value}%` }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* League benchmark tick */}
            <span
              aria-hidden
              className="absolute top-0 h-full w-px bg-ink-400"
              style={{ left: `${a.leagueAvg}%` }}
            />
          </div>

          <p className="mt-1.5 text-[11px] text-ink-400">{a.raw}</p>
        </li>
      ))}
    </ul>
  );
}
