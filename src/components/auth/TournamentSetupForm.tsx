"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createTournamentAction, type ActionState } from "@/app/login/actions";
import { Alert, FieldError, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const INITIAL: ActionState = { ok: false };

const DEFAULT_RULES = [
  "Every fixture is a 1v1 head-to-head on eFootball.",
  "Win = 3 points · Draw = 1 point · Loss = 0 points.",
  "Report your score to the admin immediately after full time.",
  "A no-show inside 15 minutes of kickoff is a 3-0 forfeit.",
].join("\n");

type Row = { id: number; name: string; clubName: string };

let nextId = 0;
const makeRow = (): Row => ({ id: nextId++, name: "", clubName: "" });

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function TournamentSetupForm() {
  const [state, formAction] = useFormState(createTournamentAction, INITIAL);
  const [rows, setRows] = useState<Row[]>(() => [
    makeRow(),
    makeRow(),
    makeRow(),
    makeRow(),
  ]);
  const [rulesText, setRulesText] = useState(DEFAULT_RULES);

  const rules = useMemo(
    () =>
      rulesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [rulesText],
  );

  const filled = useMemo(
    () => rows.filter((r) => r.name.trim().length > 0),
    [rows],
  );

  const update = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: number) =>
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((r) => r.id !== id)));

  return (
    <form action={formAction} className="space-y-5">
      {/* The dynamic roster and rule lines travel as JSON so the server action
          receives structured data instead of indexed form keys. */}
      <input
        type="hidden"
        name="players"
        readOnly
        value={JSON.stringify(
          filled.map((r) => ({
            name: r.name.trim(),
            clubName: r.clubName.trim() || undefined,
          })),
        )}
      />
      <input
        type="hidden"
        name="rules"
        readOnly
        value={JSON.stringify(rules)}
      />

      {state.error ? <Alert>{state.error}</Alert> : null}

      <div>
        <Label htmlFor="name">Tournament name</Label>
        <input
          id="name"
          name="name"
          required
          maxLength={60}
          placeholder="Local eFootball League — Season 1"
          className="field"
        />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startDate">Start date</Label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={isoDate(0)}
            className="field"
          />
          <FieldError>{state.fieldErrors?.startDate}</FieldError>
        </div>
        <div>
          <Label htmlFor="endDate">End date</Label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={isoDate(30)}
            className="field"
          />
          <FieldError>{state.fieldErrors?.endDate}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="rules" hint={`${rules.length} rule${rules.length === 1 ? "" : "s"}`}>
          Tournament rules
        </Label>
        <textarea
          id="rules"
          rows={4}
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          className="field resize-y leading-relaxed"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-ink-700">Players</span>
          <span className="text-[12px] text-ink-500">
            {filled.length} added · club optional
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {rows.map((row, index) => (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <span className="w-5 shrink-0 text-right text-[12px] font-semibold tabular-nums text-ink-400">
                  {index + 1}
                </span>
                <input
                  value={row.name}
                  onChange={(e) => update(row.id, { name: e.target.value })}
                  placeholder="Player name"
                  maxLength={40}
                  className="field flex-1"
                  aria-label={`Player ${index + 1} name`}
                />
                <input
                  value={row.clubName}
                  onChange={(e) => update(row.id, { clubName: e.target.value })}
                  placeholder="Club"
                  maxLength={40}
                  className="field w-28 shrink-0"
                  aria-label={`Player ${index + 1} club`}
                />
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  disabled={rows.length <= 2}
                  aria-label={`Remove player ${index + 1}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-400
                             transition hover:bg-brand-500/15 hover:text-brand-300
                             disabled:pointer-events-none disabled:opacity-30"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, makeRow()])}
          className="btn-ghost mt-2.5 w-full"
        >
          + Add player
        </button>
        <FieldError>{state.fieldErrors?.players}</FieldError>
      </div>

      <SubmitButton pendingLabel="Generating…">
        Create tournament
      </SubmitButton>

      <p className="text-center text-[12.5px] leading-relaxed text-ink-500">
        Each player is issued a unique invitation code and a 3-digit access code.
        You will find them all in the admin panel.
      </p>
    </form>
  );
}
