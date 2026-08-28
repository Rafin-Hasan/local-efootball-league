"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
        className="glass mb-6 grid grid-cols-2 gap-1 rounded-2xl p-1"
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
                  className="glass-solid absolute inset-0 rounded-xl"
                />
              ) : null}
              <span
                className={clsx(
                  "relative z-10",
                  active ? "text-ink" : "text-ink-500 hover:text-ink-700",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "player" ? (
            <PlayerPanel inviteCode={inviteCode} />
          ) : (
            <AdminPanel existing={existing} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
