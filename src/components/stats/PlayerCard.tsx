"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, FormPills } from "@/components/ui/Page";
import { clsx } from "@/lib/clsx";
import type { PlayerRow } from "@/lib/engine/standings";
import type { PlayerMatchRow } from "@/lib/queries";

/** Admin-only control for inspecting any player's portfolio. */
export function PlayerSwitcher({
  players,
  active,
}: {
  players: { id: string; name: string }[];
  active: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2">
      <span className="text-[12.5px] font-semibold text-ink-500">Viewing</span>
      <select
        value={active}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("player", e.target.value);
          router.push(`/stats?${next.toString()}`);
        }}
        className="field w-auto py-2 text-[13.5px] font-semibold"
      >
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The hero portfolio card: rating dial, identity, and headline ranks.
 * The dial is an SVG arc rather than a chart library — one value, no axes.
 */
export function PortfolioCard({
  name,
  club,
  rating,
  rank,
  totalPlayers,
  bootRank,
  ballRank,
  form,
}: {
  name: string;
  club: string | null;
  rating: number;
  rank: number;
  totalPlayers: number;
  bootRank: number;
  ballRank: number;
  form: ("W" | "D" | "L")[];
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, rating / 10));

  return (
    <div className="card specular overflow-hidden">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative grid shrink-0 place-items-center">
          <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="10"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="url(#rating-arc)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - pct) }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
            <defs>
              <linearGradient id="rating-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FA5F6B" />
                <stop offset="100%" stopColor="#A50E19" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute grid place-items-center text-center">
            <span className="scoreboard text-4xl leading-none tabular-nums text-ink">
              {rating === 0 ? "—" : rating.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Rating
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Avatar name={name} size={44} />
            <div className="min-w-0">
              <h2 className="display truncate text-3xl leading-none text-ink">
                {name}
              </h2>
              {club ? (
                <p className="mt-1 truncate text-[13.5px] text-ink-500">{club}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <RankChip label="League" value={rank} total={totalPlayers} tone="ink" />
            <RankChip label="Golden Boot" value={bootRank} total={totalPlayers} tone="gold" />
            <RankChip label="Golden Ball" value={ballRank} total={totalPlayers} tone="brand" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-ink-500">Form</span>
            <FormPills form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RankChip({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "ink" | "gold" | "brand";
}) {
  const styles = {
    ink: "bg-aqua-500/15 text-ink-700 ring-white/10",
    gold: "bg-gold-400/20 text-gold-300 ring-gold-400/45",
    brand: "bg-aqua-500/15 text-aqua-300 ring-aqua-400/40",
  }[tone];

  return (
    <span
      className={clsx(
        "inline-flex items-baseline gap-1.5 rounded-xl px-3 py-1.5 ring-1",
        styles,
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide opacity-75">
        {label}
      </span>
      <span className="scoreboard text-lg leading-none tabular-nums">
        #{value || "—"}
      </span>
      <span className="text-[11px] tabular-nums opacity-60">/{total}</span>
    </span>
  );
}

/** Win/draw/loss split as a single stacked bar — a donut would say no more. */
export function ResultSplit({ row }: { row: PlayerRow }) {
  const segments = [
    { label: "Won", value: row.won, className: "bg-win" },
    { label: "Drawn", value: row.drawn, className: "bg-draw" },
    { label: "Lost", value: row.lost, className: "bg-loss" },
  ];

  return (
    <div className="card specular p-5">
      <h3 className="display text-xl text-ink">Results</h3>

      {row.played === 0 ? (
        <p className="mt-3 text-[13.5px] text-ink-500">
          No matches played yet.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-aqua-500/15">
            {segments.map((segment) =>
              segment.value === 0 ? null : (
                <motion.div
                  key={segment.label}
                  className={segment.className}
                  initial={{ width: 0 }}
                  animate={{ width: `${(segment.value / row.played) * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              ),
            )}
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-3">
            {segments.map((segment) => (
              <li key={segment.label}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx("h-2 w-2 rounded-full", segment.className)}
                    aria-hidden
                  />
                  <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">
                    {segment.label}
                  </span>
                </div>
                <div className="scoreboard mt-0.5 text-2xl tabular-nums text-ink">
                  {segment.value}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function MatchHistory({ history }: { history: PlayerMatchRow[] }) {
  return (
    <div className="card specular p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="display text-xl text-ink">Match history</h3>
        <span className="text-[12.5px] text-ink-500">Newest first</span>
      </div>

      {history.length === 0 ? (
        <p className="mt-3 text-[13.5px] text-ink-500">
          No completed matches yet. Results appear here as soon as an admin
          submits a score.
        </p>
      ) : (
        <ol className="list-virtual mt-4 space-y-2">
          {history.map((match, index) => (
            <motion.li
              key={match.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-deep-800 px-3.5 py-2.5"
            >
              <span
                className={clsx(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white",
                  match.outcome === "W" && "bg-win",
                  match.outcome === "D" && "bg-draw",
                  match.outcome === "L" && "bg-loss",
                )}
              >
                {match.outcome}
              </span>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-ink">
                  {match.home ? "vs" : "away to"} {match.opponent}
                </div>
                <div className="text-[11.5px] text-ink-500">
                  GW{match.round}
                  {match.opponentClub ? ` · ${match.opponentClub}` : ""}
                </div>
              </div>

              <span className="shrink-0 scoreboard text-xl tabular-nums text-ink">
                {match.goalsFor}
                <span className="mx-0.5 text-ink-400">–</span>
                {match.goalsAgainst}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function UpcomingList({
  upcoming,
}: {
  upcoming: { id: string; round: number; opponent: string; home: boolean }[];
}) {
  return (
    <div className="card specular p-5">
      <h3 className="display text-xl text-ink">Next up</h3>

      {upcoming.length === 0 ? (
        <p className="mt-3 text-[13.5px] text-ink-500">
          No scheduled fixtures remaining.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {upcoming.slice(0, 5).map((match) => (
            <li
              key={match.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-deep-800 px-3.5 py-2.5"
            >
              <span className="chip shrink-0 bg-aqua-500/15 text-ink-600 ring-1 ring-white/10">
                GW{match.round}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                {match.home ? "vs" : "away to"} {match.opponent}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
