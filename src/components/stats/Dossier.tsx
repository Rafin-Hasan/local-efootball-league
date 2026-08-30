"use client";


import { motion } from "framer-motion";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Avatar } from "@/components/ui/Page";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BoltIcon,
  FlameIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { clsx } from "@/lib/clsx";
import type { Clubmate, Honour } from "@/lib/engine/profile";

/* ------------------------------------------------------------------ tabs */

export type TabId = "overview" | "radar" | "honours" | "squad";

const TABS: { id: TabId; label: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: "overview", label: "Performance", Icon: ActivityIcon },
  { id: "radar", label: "Attribute radar", Icon: TargetIcon },
  { id: "honours", label: "Honours", Icon: TrophyIcon },
  { id: "squad", label: "Clubmates", Icon: UsersIcon },
];

export function Tabs({
  active,
  onChange,
  counts,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
  counts: { honours: number; clubmates: number };
}) {
  return (
    <div
      role="tablist"
      aria-label="Player dossier sections"
      className="flex gap-1.5 overflow-x-auto pb-1"
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        const badge =
          id === "honours" ? counts.honours : id === "squad" ? counts.clubmates : null;

        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={clsx(
              "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition",
              on ? "text-white" : "text-ink-500 hover:text-ink",
            )}
          >
            {on ? (
              <motion.span
                layoutId="dossier-tab"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700"
              />
            ) : null}
            <Icon className={clsx("relative z-10 h-4 w-4", on ? "text-white" : "text-ink-400")} />
            <span className="relative z-10">{label}</span>
            {badge ? (
              <span
                className={clsx(
                  "relative z-10 rounded-md px-1.5 text-[10px] font-bold tabular-nums",
                  on ? "bg-black/25 text-white" : "bg-white/10 text-ink-500",
                )}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- honours */

const TONE = {
  gold: "border-gold-400/35 bg-gold-400/10 text-gold-300",
  brand: "border-brand-400/35 bg-brand-500/10 text-brand-300",
  win: "border-win/35 bg-win/10 text-win",
  ink: "border-white/10 bg-white/5 text-ink-600",
} as const;

const HONOUR_ICON: Record<string, (p: { className?: string }) => JSX.Element> = {
  boot: FlameIcon,
  ball: StarIcon,
  hat: BoltIcon,
  big: TrophyIcon,
  run: ShieldIcon,
  perfect: ShieldIcon,
  podium: StarIcon,
};

export function Honours({ honours }: { honours: Honour[] }) {
  if (honours.length === 0) {
    return (
      <div className="card specular grid place-items-center px-6 py-12 text-center">
        <p className="display text-2xl text-ink-600">No honours yet</p>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
          Honours here are earned, not awarded: a hat-trick, a win by two clear
          goals, a three-match unbeaten run, a podium place or topping a race.
          They appear the moment the record justifies them.
        </p>
      </div>
    );
  }

  return (
    <RevealGroup as="ul" trigger="mount" className="grid gap-4 sm:grid-cols-2">
      {honours.map((h) => {
        const Icon = HONOUR_ICON[h.id] ?? TrophyIcon;
        return (
          <RevealItem as="li" key={h.id}>
            <div className="card specular flex h-full items-start gap-4 p-5">
              <span
                className={clsx(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-xl border",
                  TONE[h.tone],
                )}
              >
                <Icon className="h-6 w-6" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="display text-lg leading-tight text-ink">{h.name}</h4>
                  <span className={clsx("chip shrink-0 border", TONE[h.tone])}>{h.pill}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{h.detail}</p>
              </div>
            </div>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}

/* ------------------------------------------------------------- clubmates */

export function Clubmates({
  clubmates,
  club,
}: {
  clubmates: Clubmate[];
  club: string;
}) {
  if (clubmates.length === 0) {
    return (
      <div className="card specular grid place-items-center px-6 py-12 text-center">
        <p className="display text-2xl text-ink-600">No clubmates</p>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
          Nobody else is registered under {club}. Assign another player the same
          club in the admin panel and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="card specular p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="display text-xl text-ink">{club}</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Squad record, and how this player has fared against each of them.
          </p>
        </div>
        <span className="chip bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/40">
          <UsersIcon className="h-3 w-3" />
          {clubmates.length} clubmate{clubmates.length === 1 ? "" : "s"}
        </span>
      </div>

      <RevealGroup as="ul" trigger="mount" className="grid gap-3 md:grid-cols-2">
        {clubmates.map((mate) => (
          <RevealItem as="li" key={mate.playerId}>
            <div className="well rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Avatar name={mate.name} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-ink">{mate.name}</div>
                  <div className="text-[11.5px] text-ink-500">
                    {mate.played} played · {mate.goalsFor} goals
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="scoreboard text-xl text-ink">{mate.points}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    pts
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[11.5px] font-semibold text-ink-500">Head-to-head</span>
                {mate.head.played === 0 ? (
                  <span className="text-[11.5px] text-ink-400">not yet played</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11.5px]">
                    <Tally label="W" value={mate.head.won} tone="text-win" />
                    <Tally label="D" value={mate.head.drawn} tone="text-ink-500" />
                    <Tally label="L" value={mate.head.lost} tone="text-loss" />
                  </span>
                )}
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}

function Tally({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className="flex items-baseline gap-0.5">
      <span className={clsx("scoreboard text-[13px]", tone)}>{value}</span>
      <span className="text-[10px] font-bold text-ink-400">{label}</span>
    </span>
  );
}

/* ------------------------------------------------------------ stat bento */

export function StatBento({
  tiles,
}: {
  tiles: {
    key: string;
    label: string;
    value: string;
    sub: string;
    icon: "flame" | "target" | "bolt" | "shield";
    tone: "gold" | "brand" | "win" | "ink";
    trend?: string;
  }[];
}) {
  const ICONS = { flame: FlameIcon, target: TargetIcon, bolt: BoltIcon, shield: ShieldIcon };

  return (
    <RevealGroup trigger="mount" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => {
        const Icon = ICONS[t.icon];
        return (
          <RevealItem key={t.key}>
            <div className="card specular h-full p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className={clsx("grid h-10 w-10 place-items-center rounded-xl border", TONE[t.tone])}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={clsx("chip border", TONE[t.tone])}>{t.label}</span>
              </div>

              <div className="scoreboard text-4xl leading-none text-ink">{t.value}</div>
              <div className="mt-1.5 text-[12.5px] font-semibold text-ink-600">{t.sub}</div>
              {t.trend ? (
                <p className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-brand-300">
                  {t.trend}
                  <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </p>
              ) : null}
            </div>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
