"use client";

import { useFormState } from "react-dom";
import { playerLoginAction, type ActionState } from "@/app/login/actions";
import { Alert, FieldError, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const INITIAL: ActionState = { ok: false };

export function PlayerPanel({ inviteCode }: { inviteCode?: string }) {
  const [state, formAction] = useFormState(playerLoginAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <div>
        <Label htmlFor="inviteCode" hint="from your invite">
          Invitation code
        </Label>
        <input
          id="inviteCode"
          name="inviteCode"
          defaultValue={inviteCode}
          placeholder="LFL-XXXXXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          className="field font-mono uppercase tracking-wider"
        />
        <FieldError>{state.fieldErrors?.inviteCode}</FieldError>
      </div>

      <div>
        <Label htmlFor="accessCode" hint="3 digits">
          Access code
        </Label>
        <input
          id="accessCode"
          name="accessCode"
          inputMode="numeric"
          pattern="\d{3}"
          maxLength={3}
          placeholder="•••"
          autoComplete="off"
          required
          className="field code-input text-center text-2xl font-bold tracking-[0.6em]"
        />
        <FieldError>{state.fieldErrors?.accessCode}</FieldError>
      </div>

      <SubmitButton pendingLabel="Checking…">Enter the league</SubmitButton>

      <p className="text-center text-[12.5px] leading-relaxed text-ink-500">
        Both codes come from your league admin. No password, no account.
      </p>
    </form>
  );
}
