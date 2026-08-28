"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, EmptyState, FormPills } from "@/components/ui/Page";
import { clsx } from "@/lib/clsx";
import type { RatedPlayer } from "@/lib/engine/ratings";
import type { ClubRow } from "@/lib/engine/standings";

type View = "players" | "clubs";

export function StandingsTables({
  players,
  clubs,
  highlightPlayer,
  highlightClub,
}: {
  players: RatedPlayer[];
  clubs: ClubRow[];
  highlightPlayer?: string;
  highlightClub?: string | null;
}) {
  const [view, setView] = useState<View>("players");

  if (players.length === 0) {
    return (
      <EmptyState title="No players registered">
        Once an admin creates the tournament roster, the table appears here.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Standings view"
        className="glass grid w-full max-w-sm grid-cols-2 gap-1 rounded-2xl p-1"
      >
        {(
          [
            ["players", "Players"],
            ["clubs", "Teams"],
          ] as const
        ).map(([id, label]) => {
          const active = view === id;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setView(id)}
              className="relative rounded-[0.85rem] px-4 py-2 text-sm font-semibold transition"
            >
              {active ? (
                <motion.span
                  layoutId="standings-tab"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="glass-solid absolute inset-0 rounded-[0.85rem]"
                />
              ) : null}
              <span
                className={clsx(
                  "relative z-10",
                  active ? "text-ink" : "text-ink-500 hover:text-ink-700",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {view === "players" ? (
        <PlayerTable rows={players} highlight={highlightPlayer} />
      ) : (
        <ClubTable rows={clubs} highlight={highlightClub} />
      )}
    </div>
  );
}

/* Shared table chrome. Wide tables scroll inside their own container so the
   page body never scrolls sideways. */
function TableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="card specular overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  align = "right",
  wide,
  title,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  wide?: boolean;
  title?: string;
}) {
  return (
    <th
      scope="col"
      title={title}
      className={clsx(
        "whitespace-nowrap px-2.5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-400",
        align === "left" ? "text-left" : "text-right",
        wide && "w-full",
      )}
    >
      {children}
    </th>
  );
}

const RANK_TONE = [
  "bg-gold-400/25 text-gold-600 ring-gold-400/45",
  "bg-ink-200/70 text-ink-600 ring-ink-300",
  "bg-brand-500/15 text-brand-700 ring-brand-400/40",
];

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={clsx(
        "grid h-7 w-7 place-items-center rounded-lg text-[12px] font-bold tabular-nums ring-1",
        rank <= 3
          ? RANK_TONE[rank - 1]
          : "bg-white/55 text-ink-500 ring-white/70",
      )}
    >
      {rank}
    </span>
  );
}

function PlayerTable({
  rows,
  highlight,
}: {
  rows: RatedPlayer[];
  highlight?: string;
}) {
  return (
    <TableFrame>
      <table className="w-full min-w-[46rem] border-collapse text-[13.5px]">
        <thead className="border-b border-white/60">
          <tr>
            <Th align="left">#</Th>
            <Th align="left" wide>
              Player
            </Th>
            <Th title="Matches played">MP</Th>
            <Th title="Won">W</Th>
            <Th title="Drawn">D</Th>
            <Th title="Lost">L</Th>
            <Th title="Goals for">GF</Th>
            <Th title="Goals against">GA</Th>
            <Th title="Goal difference">GD</Th>
            <Th title="Clean sheets">CS</Th>
            <Th title="Golden Ball rating">Rating</Th>
            <Th align="left">Form</Th>
            <Th title="Points">Pts</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const mine = row.playerId === highlight;
            return (
              <motion.tr
                key={row.playerId}
                layout
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                className={clsx(
                  "border-b border-white/45 last:border-0 transition",
                  mine ? "bg-brand-500/[0.07]" : "hover:bg-white/45",
                )}
              >
                <td className="px-2.5 py-2.5">
                  <RankBadge rank={index + 1} />
                </td>
                <td className="px-2.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.name} size={30} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">
                        {row.name}
                        {mine ? (
                          <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                            You
                          </span>
                        ) : null}
                      </div>
                      {row.clubName ? (
                        <div className="truncate text-[11.5px] text-ink-500">
                          {row.clubName}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <Td>{row.played}</Td>
                <Td>{row.won}</Td>
                <Td>{row.drawn}</Td>
                <Td>{row.lost}</Td>
                <Td>{row.goalsFor}</Td>
                <Td>{row.goalsAgainst}</Td>
                <Td>
                  <span
                    className={clsx(
                      row.goalDiff > 0 && "text-emerald-600",
                      row.goalDiff < 0 && "text-brand-600",
                    )}
                  >
                    {row.goalDiff > 0 ? "+" : ""}
                    {row.goalDiff}
                  </span>
                </Td>
                <Td>{row.cleanSheets}</Td>
                <Td>
                  <span className="font-semibold text-ink">
                    {row.played === 0 ? "—" : row.rating.toFixed(2)}
                  </span>
                </Td>
                <td className="px-2.5 py-2.5">
                  <FormPills form={row.form} size="sm" />
                </td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className="display text-xl tabular-nums text-ink">
                    {row.points}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </TableFrame>
  );
}

function ClubTable({
  rows,
  highlight,
}: {
  rows: ClubRow[];
  highlight?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title="No teams yet">
        Teams appear once players are assigned a club.
      </EmptyState>
    );
  }

  return (
    <TableFrame>
      <table className="w-full min-w-[38rem] border-collapse text-[13.5px]">
        <thead className="border-b border-white/60">
          <tr>
            <Th align="left">#</Th>
            <Th align="left" wide>
              Team
            </Th>
            <Th title="Matches played">MP</Th>
            <Th title="Won">W</Th>
            <Th title="Drawn">D</Th>
            <Th title="Lost">L</Th>
            <Th title="Goals for">GF</Th>
            <Th title="Goals against">GA</Th>
            <Th title="Goal difference">GD</Th>
            <Th title="Points">Pts</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const mine = row.club === highlight;
            return (
              <motion.tr
                key={row.club}
                layout
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                className={clsx(
                  "border-b border-white/45 last:border-0 transition",
                  mine ? "bg-brand-500/[0.07]" : "hover:bg-white/45",
                )}
              >
                <td className="px-2.5 py-2.5">
                  <RankBadge rank={index + 1} />
                </td>
                <td className="px-2.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.club} size={30} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">
                        {row.club}
                      </div>
                      <div className="truncate text-[11.5px] text-ink-500">
                        {row.members.join(", ")}
                      </div>
                    </div>
                  </div>
                </td>
                <Td>{row.played}</Td>
                <Td>{row.won}</Td>
                <Td>{row.drawn}</Td>
                <Td>{row.lost}</Td>
                <Td>{row.goalsFor}</Td>
                <Td>{row.goalsAgainst}</Td>
                <Td>
                  <span
                    className={clsx(
                      row.goalDiff > 0 && "text-emerald-600",
                      row.goalDiff < 0 && "text-brand-600",
                    )}
                  >
                    {row.goalDiff > 0 ? "+" : ""}
                    {row.goalDiff}
                  </span>
                </Td>
                <td className="px-2.5 py-2.5 text-right">
                  <span className="display text-xl tabular-nums text-ink">
                    {row.points}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </TableFrame>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums text-ink-700">
      {children}
    </td>
  );
}
