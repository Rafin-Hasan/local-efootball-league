"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function partsUntil(target: number, now: number): Parts {
  const delta = Math.max(0, target - now);
  const totalSeconds = Math.floor(delta / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Ticks toward the tournament end date.
 *
 * Renders nothing time-dependent until mounted: the server and the client
 * would otherwise disagree on "now" and React would flag a hydration mismatch.
 */
export function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const finished = now !== null && now >= target;
  const parts = now === null ? null : partsUntil(target, now);

  const units: { label: string; value: number | null }[] = [
    { label: "Days", value: parts?.days ?? null },
    { label: "Hours", value: parts?.hours ?? null },
    { label: "Minutes", value: parts?.minutes ?? null },
    { label: "Seconds", value: parts?.seconds ?? null },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="chip border border-brand-200/70 bg-brand-500/15 text-brand-300 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-loss" />
          </span>
          {finished ? "Season complete" : "Season ends in"}
        </p>
        <h3 className="display mt-2 text-3xl text-ink">
          {finished ? "Full time" : "Race against the clock"}
        </h3>
      </div>

      <div
        className="grid grid-cols-4 gap-2 sm:gap-3"
        role="timer"
        aria-live="off"
        aria-label="Time remaining in the season"
      >
        {units.map((unit) => (
          <div
            key={unit.label}
            className="panel specular relative min-w-[4.25rem] rounded-2xl px-3 py-3 text-center"
          >
            <div className="scoreboard text-3xl tabular-nums text-ink">
              {unit.value === null ? (
                <span className="inline-block h-8 w-10 animate-pulse rounded bg-white/10 align-middle" />
              ) : (
                String(unit.value).padStart(2, "0")
              )}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
