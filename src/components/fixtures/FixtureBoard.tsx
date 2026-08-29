"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, EmptyState } from "@/components/ui/Page";
import { clsx } from "@/lib/clsx";
import type { FixtureRound, FixtureRow } from "@/lib/queries";

type Filter = "all" | "played" | "upcoming";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "played", label: "Played" },
  { id: "upcoming", label: "Upcoming" },
];

function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function FixtureBoard({
  rounds,
  currentRound,
  highlightPlayer,
}: {
  rounds: FixtureRound[];
  /** The next round with unplayed matches; opened by default. */
  currentRound: number;
  /** Signed-in player's id, so their own fixtures stand out. */
  highlightPlayer?: string;
}) {
  const [round, setRound] = useState<number | "all">(currentRound);
  const [filter, setFilter] = useState<Filter>("all");
  const [mineOnly, setMineOnly] = useState(false);

  const visible = useMemo(() => {
    const scoped = round === "all" ? rounds : rounds.filter((r) => r.round === round);
    return scoped
      .map((entry) => ({
        ...entry,
        matches: entry.matches.filter((m) => {
          if (filter === "played" && !m.played) return false;
          if (filter === "upcoming" && m.played) return false;
          if (mineOnly && !isMine(m, highlightPlayer)) return false;
          return true;
        }),
      }))
      .filter((entry) => entry.matches.length > 0);
  }, [rounds, round, filter, mineOnly, highlightPlayer]);

  if (rounds.length === 0) {
    return (
      <EmptyState title="No fixtures yet">
        An admin needs to run the fixture generator from the admin panel before
        the schedule appears here.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card specular flex flex-wrap items-center gap-x-6 gap-y-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 strap">
            Gameweek
          </div>
          <div className="flex flex-wrap gap-1.5">
            <RoundChip
              active={round === "all"}
              onClick={() => setRound("all")}
              label="All"
            />
            {rounds.map((entry) => (
              <RoundChip
                key={entry.round}
                active={round === entry.round}
                onClick={() => setRound(entry.round)}
                label={`GW${entry.round}`}
                complete={entry.played === entry.total}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 strap">
            Status
          </div>
          <div className="flex gap-1.5">
            {FILTERS.map((item) => (
              <RoundChip
                key={item.id}
                active={filter === item.id}
                onClick={() => setFilter(item.id)}
                label={item.label}
              />
            ))}
          </div>
        </div>

        {highlightPlayer ? (
          <div>
            <div className="mb-2 strap">
              Scope
            </div>
            <RoundChip
              active={mineOnly}
              onClick={() => setMineOnly((v) => !v)}
              label="My matches"
            />
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nothing matches those filters">
          Try a different gameweek or clear the status filter.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((entry) => (
              <motion.section
                key={entry.round}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="accent-bar mb-3 flex items-baseline justify-between gap-4 pl-3">
                  <h2 className="display text-2xl text-ink">
                    Gameweek {entry.round}
                  </h2>
                  <span className="text-[12.5px] text-ink-500">
                    {formatKickoff(entry.kickoff)} ·{" "}
                    <span className="tabular-nums">
                      {entry.played}/{entry.total}
                    </span>{" "}
                    played
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {entry.matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      mine={isMine(match, highlightPlayer)}
                    />
                  ))}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function isMine(match: FixtureRow, playerId?: string): boolean {
  if (!playerId) return false;
  return match.homeId === playerId || match.awayId === playerId;
}

function RoundChip({
  label,
  active,
  onClick,
  complete,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  complete?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "relative rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition",
        active
          ? "bg-aqua-500 text-deep-950 shadow-glow"
          : "bg-deep-800 text-ink-600 ring-1 ring-white/10 hover:bg-deep-600",
      )}
    >
      {label}
      {complete && !active ? (
        <span
          aria-hidden
          className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-win align-middle"
        />
      ) : null}
    </button>
  );
}

function MatchCard({ match, mine }: { match: FixtureRow; mine: boolean }) {
  const homeWon = match.played && (match.homeGoals ?? 0) > (match.awayGoals ?? 0);
  const awayWon = match.played && (match.awayGoals ?? 0) > (match.homeGoals ?? 0);

  return (
    <article
      className={clsx(
        "card specular p-4 transition",
        mine && "ring-1 ring-aqua-400/40",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={clsx(
            "chip",
            match.played
              ? "bg-win/15 text-win ring-1 ring-win/30"
              : "bg-deep-700 text-ink-500 ring-1 ring-white/10",
          )}
        >
          {match.played ? "Full time" : "Scheduled"}
        </span>
        {mine ? (
          <span className="chip bg-aqua-500/15 text-aqua-300 ring-1 ring-aqua-400/40">
            You
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Side
          name={match.homeName}
          club={match.homeClub}
          dimmed={match.played && !homeWon && !isDraw(match)}
        />

        <div className="text-center">
          {match.played ? (
            <div className="scoreboard text-3xl leading-none tabular-nums text-ink">
              {match.homeGoals}
              <span className="mx-1 text-ink-400">–</span>
              {match.awayGoals}
            </div>
          ) : (
            <div className="display text-lg leading-none text-ink-400">vs</div>
          )}
        </div>

        <Side
          name={match.awayName}
          club={match.awayClub}
          align="right"
          dimmed={match.played && !awayWon && !isDraw(match)}
        />
      </div>
    </article>
  );
}

function isDraw(match: FixtureRow): boolean {
  return match.played && match.homeGoals === match.awayGoals;
}

function Side({
  name,
  club,
  align = "left",
  dimmed,
}: {
  name: string;
  club: string | null;
  align?: "left" | "right";
  dimmed?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex min-w-0 items-center gap-2.5",
        align === "right" && "flex-row-reverse text-right",
        dimmed && "opacity-55",
      )}
    >
      <Avatar name={name} size={32} />
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-ink" title={name}>
          {name}
        </div>
        {club ? (
          <div className="truncate text-[11.5px] text-ink-500" title={club}>
            {club}
          </div>
        ) : null}
      </div>
    </div>
  );
}
