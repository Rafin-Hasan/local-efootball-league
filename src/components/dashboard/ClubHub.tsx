"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, FormPills } from "@/components/ui/Page";
import { clsx } from "@/lib/clsx";
import type { RatedPlayer } from "@/lib/engine/ratings";
import type { ClubRow } from "@/lib/engine/standings";

/** Team picker. Admins roam every club; players land on their own. */
export function ClubSwitcher({
  clubs,
  active,
}: {
  clubs: ClubRow[];
  active: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  if (clubs.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {clubs.map((club) => {
        const isActive = club.club === active;
        return (
          <button
            key={club.club}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              next.set("club", club.club);
              router.push(`/dashboard?${next.toString()}`);
            }}
            aria-pressed={isActive}
            className={clsx(
              "rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition",
              isActive
                ? "bg-brand-500 text-white shadow-glow"
                : "control text-ink-600",
            )}
          >
            {club.club}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Points contributed by each squad member, as a share of the team total.
 * A horizontal bar per player reads faster than a pie at this row count.
 */
export function ContributionChart({ members }: { members: RatedPlayer[] }) {
  const total = members.reduce((sum, m) => sum + m.points, 0);
  const max = Math.max(1, ...members.map((m) => m.points));

  return (
    <div className="card specular p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="display text-xl text-ink">Points contribution</h3>
        <span className="text-[12.5px] text-ink-500">
          {total} pts across {members.length}{" "}
          {members.length === 1 ? "player" : "players"}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-[13.5px] text-ink-500">
          No points on the board yet. Bars fill in as results are submitted.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {members.map((member, index) => {
            const share = total === 0 ? 0 : Math.round((member.points / total) * 100);
            return (
              <li key={member.playerId}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13.5px] font-semibold text-ink">
                    {member.name}
                  </span>
                  <span className="shrink-0 text-[12.5px] tabular-nums text-ink-500">
                    {member.points} pts · {share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(member.points / max) * 100}%` }}
                    transition={{
                      duration: 0.7,
                      delay: index * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Cumulative points per gameweek. Drawn as an inline SVG sparkline rather than
 * a chart library — one series, no interaction, no reason to ship 40kB.
 */
export function TrendChart({
  points,
}: {
  points: { round: number; cumulative: number }[];
}) {
  const width = 560;
  const height = 140;
  const padX = 8;
  const padY = 12;

  const max = Math.max(1, ...points.map((p) => p.cumulative));
  const stepX =
    points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y: height - padY - (p.cumulative / max) * (height - padY * 2),
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const area =
    coords.length > 0
      ? `${line} L${coords[coords.length - 1].x.toFixed(1)},${height - padY} L${coords[0].x.toFixed(1)},${height - padY} Z`
      : "";

  return (
    <div className="card specular p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="display text-xl text-ink">Points trend</h3>
        <span className="text-[12.5px] text-ink-500">
          Cumulative, by gameweek
        </span>
      </div>

      {points.length < 2 ? (
        <p className="mt-4 text-[13.5px] text-ink-500">
          The trend line needs at least two completed gameweeks.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-36 w-full min-w-[20rem]"
            role="img"
            aria-label={`Cumulative points rising to ${max} by gameweek ${points[points.length - 1].round}`}
          >
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E11D2A" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#E11D2A" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={area} fill="url(#trend-fill)" />
            <motion.path
              d={line}
              fill="none"
              stroke="#FF5A67"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
            {coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={3}
                fill="#0C0A0B"
                stroke="#FF5A67"
                strokeWidth={2}
              />
            ))}
          </svg>

          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-ink-400">
            <span>GW{points[0].round}</span>
            <span>GW{points[points.length - 1].round}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RosterList({
  members,
  highlight,
}: {
  members: RatedPlayer[];
  highlight?: string;
}) {
  return (
    <div className="card specular p-5">
      <h3 className="display text-xl text-ink">Active roster</h3>

      <ul className="list-virtual mt-4 divide-y divide-white/10">
        {members.map((member) => (
          <li
            key={member.playerId}
            className={clsx(
              "flex items-center gap-3 py-3 first:pt-0 last:pb-0",
              member.playerId === highlight && "rounded-xl bg-brand-500/15 px-2",
            )}
          >
            <Avatar name={member.name} size={38} />

            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-ink">
                {member.name}
                {member.playerId === highlight ? (
                  <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-brand-300">
                    You
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-500">
                <span className="tabular-nums">{member.played} MP</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{member.goalsFor} goals</span>
                <span aria-hidden>·</span>
                <FormPills form={member.form} size="sm" />
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="scoreboard text-2xl tabular-nums text-ink">
                {member.points}
              </div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">
                pts
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
