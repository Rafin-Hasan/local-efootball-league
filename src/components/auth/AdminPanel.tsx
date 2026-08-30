"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { motion } from "framer-motion";
import { openTournamentAction, type ActionState } from "@/app/login/actions";
import { Alert } from "@/components/ui/Field";
import { clsx } from "@/lib/clsx";
import { TournamentSetupForm } from "./TournamentSetupForm";

const INITIAL: ActionState = { ok: false };

export type ExistingTournament = {
  id: string;
  name: string;
  playerCount: number;
  startDate: string;
  endDate: string;
};

export function AdminPanel({
  existing,
}: {
  existing: ExistingTournament[];
}) {
  const [state, formAction] = useFormState(openTournamentAction, INITIAL);
  const [showExisting, setShowExisting] = useState(false);

  return (
    <div className="space-y-5">
      <TournamentSetupForm />

      {existing.length > 0 ? (
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowExisting((v) => !v)}
            aria-expanded={showExisting}
            className="btn-ghost w-full"
          >
            {showExisting
              ? "Hide existing tournaments"
              : `Or open an existing tournament (${existing.length})`}
          </button>

          {showExisting ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-3 space-y-2"
            >
              {state.error ? <Alert>{state.error}</Alert> : null}

              {existing.map((tournament) => (
                <form key={tournament.id} action={formAction}>
                  <input
                    type="hidden"
                    name="tournamentId"
                    value={tournament.id}
                  />
                  <button
                    type="submit"
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-2xl border border-white/10",
                      "control well-hover px-3.5 py-3 text-left",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">
                        {tournament.name}
                      </span>
                      <span className="block text-[11.5px] text-ink-500">
                        {tournament.playerCount}{" "}
                        {tournament.playerCount === 1 ? "player" : "players"} ·{" "}
                        {tournament.startDate} → {tournament.endDate}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-brand-300">
                      Open
                    </span>
                  </button>
                </form>
              ))}
            </motion.div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
