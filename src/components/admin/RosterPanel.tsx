"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { motion } from "framer-motion";
import {
  addPlayerAction,
  removePlayerAction,
  rotateCodesAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Alert, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Avatar } from "@/components/ui/Page";
import { clsx } from "@/lib/clsx";

const IDLE: AdminActionState = { ok: false };

export type RosterEntry = {
  id: string;
  name: string;
  clubName: string | null;
  accessCode: string;
  inviteCode: string;
};

export function RosterPanel({
  roster,
  origin,
}: {
  roster: RosterEntry[];
  /** Absolute origin so invite links are shareable, not relative. */
  origin: string;
}) {
  const [addState, addAction] = useFormState(addPlayerAction, IDLE);
  const [rowState, rowAction] = useFormState(
    async (prev: AdminActionState, formData: FormData) => {
      const intent = String(formData.get("intent") ?? "");
      if (intent === "remove") return removePlayerAction(prev, formData);
      if (intent === "rotate") return rotateCodesAction(prev, formData);
      return { ok: false, error: "Unknown action." };
    },
    IDLE,
  );

  const [revealed, setRevealed] = useState(false);

  return (
    <section className="card specular p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="display text-2xl text-ink">Roster &amp; access codes</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">
            Each player signs in with their invitation code plus their 3-digit
            PIN. Treat both as secrets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="btn-ghost"
        >
          {revealed ? "Hide codes" : "Reveal codes"}
        </button>
      </div>

      {rowState.error ? (
        <div className="mt-4">
          <Alert>{rowState.error}</Alert>
        </div>
      ) : null}
      {rowState.ok && rowState.message ? (
        <div className="mt-4">
          <Alert tone="info">{rowState.message}</Alert>
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-[13.5px]">
          <thead className="border-b border-white/60">
            <tr>
              <th className="px-2.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Player
              </th>
              <th className="px-2.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Invitation code
              </th>
              <th className="px-2.5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-400">
                PIN
              </th>
              <th className="px-2.5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {roster.map((player) => (
              <tr
                key={player.id}
                className="border-b border-white/45 last:border-0 hover:bg-white/45"
              >
                <td className="px-2.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={player.name} size={30} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">
                        {player.name}
                      </div>
                      {player.clubName ? (
                        <div className="truncate text-[11.5px] text-ink-500">
                          {player.clubName}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-2.5 py-3">
                  <Secret
                    value={player.inviteCode}
                    revealed={revealed}
                    copyValue={`${origin}/login?invite=${encodeURIComponent(player.inviteCode)}`}
                    copyLabel="Copy invite link"
                  />
                </td>

                <td className="px-2.5 py-3">
                  <Secret
                    value={player.accessCode}
                    revealed={revealed}
                    copyValue={player.accessCode}
                    copyLabel="Copy PIN"
                    mono
                  />
                </td>

                <td className="px-2.5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <form action={rowAction}>
                      <input type="hidden" name="intent" value="rotate" />
                      <input type="hidden" name="playerId" value={player.id} />
                      <RowButton title="Issue new codes for this player">
                        Rotate
                      </RowButton>
                    </form>

                    <form
                      action={rowAction}
                      onSubmit={(e) => {
                        if (
                          !window.confirm(
                            `Remove ${player.name}? This also deletes their played results and cannot be undone.`,
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="intent" value="remove" />
                      <input type="hidden" name="playerId" value={player.id} />
                      <RowButton danger title="Remove player and their results">
                        Remove
                      </RowButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={addAction}
        className="mt-6 border-t border-white/60 pt-5"
      >
        <Label htmlFor="new-player">Add a player</Label>
        {addState.error ? (
          <div className="mb-3">
            <Alert>{addState.error}</Alert>
          </div>
        ) : null}
        {addState.ok && addState.message ? (
          <div className="mb-3">
            <Alert tone="info">{addState.message}</Alert>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="new-player"
            name="name"
            required
            maxLength={40}
            placeholder="Player name"
            className="field flex-1"
          />
          <input
            name="clubName"
            maxLength={40}
            placeholder="Club (optional)"
            className="field sm:w-48"
          />
          <div className="sm:w-40">
            <SubmitButton pendingLabel="Adding…">Add player</SubmitButton>
          </div>
        </div>
      </form>
    </section>
  );
}

function RowButton({
  children,
  danger,
  title,
}: {
  children: React.ReactNode;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={clsx(
        "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition",
        danger
          ? "text-brand-600 hover:bg-brand-500/12"
          : "text-ink-600 hover:bg-white/70",
      )}
    >
      {children}
    </button>
  );
}

function Secret({
  value,
  revealed,
  copyValue,
  copyLabel,
  mono,
}: {
  value: string;
  revealed: boolean;
  copyValue: string;
  copyLabel: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          "select-all rounded-lg bg-white/60 px-2 py-1 text-[12.5px] ring-1 ring-white/70",
          mono ? "font-mono tabular-nums" : "font-mono",
          !revealed && "blur-[5px]",
        )}
        aria-hidden={!revealed}
      >
        {value}
      </span>

      <button
        type="button"
        title={copyLabel}
        aria-label={copyLabel}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copyValue);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          } catch {
            // Clipboard can be blocked (insecure origin, denied permission);
            // the value is select-all above, so copying by hand still works.
            setCopied(false);
          }
        }}
        className="text-[11.5px] font-semibold text-ink-500 transition hover:text-brand-600"
      >
        {copied ? (
          <motion.span
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-600"
          >
            Copied
          </motion.span>
        ) : (
          "Copy"
        )}
      </button>
    </div>
  );
}
