"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import {
  clearScoreAction,
  generateFixturesAction,
  submitScoreAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Alert } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/Page";
import { clsx } from "@/lib/clsx";
import type { FixtureRound } from "@/lib/queries";

const IDLE: AdminActionState = { ok: false };

export function FixtureGenerator({ hasFixtures }: { hasFixtures: boolean }) {
  const [state, action] = useFormState(generateFixturesAction, IDLE);
  const [legs, setLegs] = useState<1 | 2>(1);

  return (
    <section className="card specular p-5">
      <h2 className="display text-2xl text-ink">Fixture generator</h2>
      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
        Builds a round robin where every player meets every other exactly once
        per leg. Safe to re-run: played results are kept, only unplayed fixtures
        are rebuilt.
      </p>

      {state.error ? (
        <div className="mt-4">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.ok && state.message ? (
        <div className="mt-4">
          <Alert tone="info">{state.message}</Alert>
        </div>
      ) : null}

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="legs" value={legs} />

        <div>
          <div className="mb-1.5 strap">
            Format
          </div>
          <div className="flex gap-1.5">
            {([1, 2] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLegs(value)}
                aria-pressed={legs === value}
                className={clsx(
                  "rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition",
                  legs === value
                    ? "bg-aqua-500 text-deep-950 shadow-glow"
                    : "bg-deep-800 text-ink-600 ring-1 ring-white/10 hover:bg-deep-600",
                )}
              >
                {value === 1 ? "Single round" : "Home & away"}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-52">
          <SubmitButton pendingLabel="Generating…">
            {hasFixtures ? "Regenerate fixtures" : "Generate fixtures"}
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

export function ScoreEntry({ rounds }: { rounds: FixtureRound[] }) {
  const firstOpen =
    rounds.find((r) => r.played < r.total)?.round ?? rounds[0]?.round ?? 1;
  const [round, setRound] = useState(firstOpen);

  const active = useMemo(
    () => rounds.find((r) => r.round === round) ?? rounds[0],
    [rounds, round],
  );

  if (rounds.length === 0) {
    return (
      <EmptyState title="No fixtures to score">
        Run the fixture generator above, then results can be entered here.
      </EmptyState>
    );
  }

  return (
    <section className="card specular p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="display text-2xl text-ink">Score entry</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">
            Saving a score recalculates every table and rating immediately.
          </p>
        </div>
        <span className="text-[12.5px] tabular-nums text-ink-500">
          {active?.played ?? 0}/{active?.total ?? 0} played this gameweek
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {rounds.map((entry) => (
          <button
            key={entry.round}
            type="button"
            onClick={() => setRound(entry.round)}
            aria-pressed={round === entry.round}
            className={clsx(
              "rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition",
              round === entry.round
                ? "bg-aqua-500 text-deep-950 shadow-glow"
                : "bg-deep-800 text-ink-600 ring-1 ring-white/10 hover:bg-deep-600",
            )}
          >
            GW{entry.round}
            {entry.played === entry.total && round !== entry.round ? (
              <span
                aria-hidden
                className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-win align-middle"
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {active?.matches.map((match) => (
          <ScoreRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

function ScoreRow({ match }: { match: FixtureRound["matches"][number] }) {
  const [saveState, saveAction] = useFormState(submitScoreAction, IDLE);
  const [clearState, clearAction] = useFormState(clearScoreAction, IDLE);

  const error = saveState.error ?? clearState.error;

  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-deep-800 px-3.5 py-3",
        match.played && "bg-win/[0.06]",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-right text-[13.5px] font-semibold text-ink">
          {match.homeName}
        </span>

        <form
          action={saveAction}
          className="flex shrink-0 items-center gap-1.5"
        >
          <input type="hidden" name="matchId" value={match.id} />
          <ScoreInput
            name="homeGoals"
            defaultValue={match.homeGoals}
            label={`${match.homeName} goals`}
          />
          <span className="text-ink-400">–</span>
          <ScoreInput
            name="awayGoals"
            defaultValue={match.awayGoals}
            label={`${match.awayName} goals`}
          />
          <button
            type="submit"
            className="btn-primary ml-1.5 px-3 py-1.5 text-[12.5px]"
          >
            Save
          </button>
        </form>

        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
          {match.awayName}
        </span>

        {match.played ? (
          <form action={clearAction} className="shrink-0">
            <input type="hidden" name="matchId" value={match.id} />
            <button
              type="submit"
              title="Clear this result and reopen the fixture"
              className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-500 transition hover:bg-aqua-500/15 hover:text-aqua-300"
            >
              Clear
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] font-medium text-aqua-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ScoreInput({
  name,
  defaultValue,
  label,
}: {
  name: string;
  defaultValue: number | null;
  label: string;
}) {
  return (
    <input
      name={name}
      aria-label={label}
      inputMode="numeric"
      pattern="\d{1,2}"
      maxLength={2}
      required
      defaultValue={defaultValue ?? ""}
      placeholder="–"
      className="field code-input h-9 w-12 px-0 text-center text-[15px] font-bold"
    />
  );
}
