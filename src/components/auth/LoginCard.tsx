"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import { AdminPanel, type ExistingTournament } from "./AdminPanel";
import { PlayerPanel } from "./PlayerPanel";

type Tab = "player" | "admin";

const TABS: { id: Tab; label: string; blurb: string }[] = [
  { id: "player", label: "Player", blurb: "Enter with your codes" },
  { id: "admin", label: "Admin", blurb: "Create a tournament" },
];

export function LoginCard({
  inviteCode,
  existing,
  initialTab = "player",
}: {
  inviteCode?: string;
  existing: ExistingTournament[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Sign in as"
        className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-deep-950/45 p-1"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className="relative rounded-[0.85rem] px-4 py-2.5 text-sm font-semibold transition"
            >
              {active ? (
                <motion.span
                  layoutId="login-tab"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl border border-white/25
                             bg-gradient-to-b from-white/[0.22] to-white/[0.06]
                             shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),inset_0_-1px_0_0_rgba(245,197,66,0.28)]"
                />
              ) : null}
              <span
                className={clsx(
                  "relative z-10",
                  active ? "text-ink" : "text-ink-600 hover:text-ink",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {tab === "player" ? (
          <PlayerPanel inviteCode={inviteCode} />
        ) : (
          <AdminPanel existing={existing} />
        )}
      </motion.div>
    </div>
  );
}
