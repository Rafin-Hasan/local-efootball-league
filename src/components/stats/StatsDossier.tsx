"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AxisBars, RadarChart } from "@/components/stats/RadarChart";
import { Clubmates, Honours, StatBento, Tabs, type TabId } from "@/components/stats/Dossier";
import { MatchHistory, ResultSplit, UpcomingList } from "@/components/stats/PlayerCard";
import { TiltCard } from "@/components/stats/TiltCard";
import type { Clubmate, Honour, RadarAxis } from "@/lib/engine/profile";
import type { PlayerRow } from "@/lib/engine/standings";
import type { PlayerMatchRow } from "@/lib/queries";

/**
 * Tabbed player dossier. State lives here so the server page stays a server
 * component and only this shell ships to the browser.
 */
export function StatsDossier({
  name,
  club,
  row,
  rating,
  leagueRank,
  bootRank,
  ballRank,
  totalPlayers,
  axes,
  honours,
  clubmates,
  history,
  upcoming,
  tiles,
}: {
  name: string;
  club: string | null;
  row: PlayerRow;
  rating: number;
  leagueRank: number;
  bootRank: number;
  ballRank: number;
  totalPlayers: number;
  axes: RadarAxis[];
  honours: Honour[];
  clubmates: Clubmate[];
  history: PlayerMatchRow[];
  upcoming: { id: string; round: number; opponent: string; home: boolean }[];
  tiles: React.ComponentProps<typeof StatBento>["tiles"];
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <>
      {/* Hero: card beside identity and headline numbers */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <TiltCard
          name={name}
          club={club}
          rating={rating}
          leagueRank={leagueRank}
          bootRank={bootRank}
          ballRank={ballRank}
          totalPlayers={totalPlayers}
          form={row.form}
          axes={axes}
          goals={row.goalsFor}
          played={row.played}
        />

        <div className="card specular p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <Figure label="Points" value={row.points} tone="text-brand-300" />
            <Figure
              label="Record"
              value={`${row.won}-${row.drawn}-${row.lost}`}
              sub={row.played ? `${Math.round((row.won / row.played) * 100)}% wins` : "no matches"}
            />
            <Figure
              label="Goals"
              value={row.goalsFor}
              sub={row.played ? `${(row.goalsFor / row.played).toFixed(2)} / match` : undefined}
              tone="text-gold-300"
            />
            <Figure
              label="Goal diff"
              value={`${row.goalDiff > 0 ? "+" : ""}${row.goalDiff}`}
              sub={`${row.goalsAgainst} conceded`}
              tone={row.goalDiff >= 0 ? "text-win" : "text-loss"}
            />
          </div>

          <p className="mt-5 border-t border-white/10 pt-4 text-[12.5px] leading-relaxed text-ink-500">
            Every figure on this page is derived live from played 1v1 results.
            There is no shot, possession or assist data in this league, so
            nothing here is estimated.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <Tabs
          active={tab}
          onChange={setTab}
          counts={{ honours: honours.length, clubmates: clubmates.length }}
        />
      </div>

      <div className="mt-5">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
            {tab === "overview" ? (
              <div className="space-y-5">
                <StatBento tiles={tiles} />
                <div className="grid gap-5 lg:grid-cols-2">
                  <ResultSplit row={row} />
                  <UpcomingList upcoming={upcoming} />
                </div>
                <MatchHistory history={history} />
              </div>
            ) : null}

            {tab === "radar" ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="card specular p-5 sm:p-6">
                  <h3 className="display text-xl text-ink">Attribute radar</h3>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    Six measurements of this record, against the league average.
                  </p>
                  <div className="mt-5">
                    <RadarChart axes={axes} />
                  </div>
                </div>

                <div className="card specular p-5 sm:p-6">
                  <h3 className="display text-xl text-ink">What each axis measures</h3>
                  <p className="mt-0.5 mb-4 text-[12.5px] text-ink-500">
                    The tick on each bar marks the league average.
                  </p>
                  <AxisBars axes={axes} />
                </div>
              </div>
            ) : null}

            {tab === "honours" ? <Honours honours={honours} /> : null}

            {tab === "squad" ? (
              <Clubmates clubmates={clubmates} club={(club ?? "").trim() || name} />
            ) : null}
        </motion.div>
      </div>
    </>
  );
}

function Figure({
  label,
  value,
  sub,
  tone = "text-ink",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="strap">{label}</div>
      <div className={`scoreboard mt-1 text-3xl leading-none ${tone}`}>{value}</div>
      {sub ? <div className="mt-1 text-[11.5px] text-ink-500">{sub}</div> : null}
    </div>
  );
}
