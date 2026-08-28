"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import {
  generateInviteCode,
  generateUniqueAccessCodes,
  normalizeInviteCode,
} from "@/lib/codes";
import { db } from "@/lib/db";
import { createTournamentSchema, playerLoginSchema } from "@/lib/validation";

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function setSession(
  session: Parameters<typeof signSession>[0],
): Promise<void> {
  const token = await signSession(session);
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions);
}

/* ------------------------------------------------------------------ admin */

/**
 * Create a tournament and sign in as its admin.
 *
 * There is no admin password: filling in this form *is* the admin flow. Rate
 * limiting is therefore the only thing standing between a visitor and a new
 * tournament, so it is deliberately tighter than the player limit.
 */
export async function createTournamentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp(headers());
  const limit = rateLimit(`setup:${ip}`, 4, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many tournaments created. Try again in ${limit.retryAfterSeconds}s.`,
    };
  }

  let playersRaw: unknown;
  let rulesRaw: unknown;
  try {
    playersRaw = JSON.parse(String(formData.get("players") ?? "[]"));
    rulesRaw = JSON.parse(String(formData.get("rules") ?? "[]"));
  } catch {
    return { ok: false, error: "Could not read the player list." };
  }

  const parsed = createTournamentSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    players: playersRaw,
    rules: rulesRaw,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
      fieldErrors,
    };
  }

  const { name, startDate, endDate, players, rules } = parsed.data;

  let codes: string[];
  try {
    // PINs only need to be unique within this tournament, so a fresh draw.
    codes = generateUniqueAccessCodes(players.length);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not issue codes.",
    };
  }

  const tournament = await db.tournament.create({
    data: {
      name,
      startDate,
      endDate,
      rules,
      players: {
        create: players.map((player, index) => ({
          name: player.name,
          clubName: player.clubName ?? null,
          accessCode: codes[index],
          inviteCode: generateInviteCode(),
        })),
      },
    },
    select: { id: true },
  });

  await setSession({ role: "admin", tournamentId: tournament.id });
  redirect("/?welcome=1");
}

/**
 * Re-enter a tournament that already exists as its admin.
 *
 * Without this an admin who closed the browser could never get back in — the
 * create form is the only other door. Like that form, it is unauthenticated.
 */
export async function openTournamentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp(headers());
  const limit = rateLimit(`open:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s.`,
    };
  }

  const tournamentId = String(formData.get("tournamentId") ?? "");
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });

  if (!tournament) {
    return { ok: false, error: "That tournament no longer exists." };
  }

  await setSession({ role: "admin", tournamentId: tournament.id });
  redirect("/");
}

/* ----------------------------------------------------------------- player */

export async function playerLoginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp(headers());
  const limit = rateLimit(`player:${ip}`, 8, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many attempts. Try again in ${limit.retryAfterSeconds}s.`,
    };
  }

  const parsed = playerLoginSchema.safeParse({
    inviteCode: String(formData.get("inviteCode") ?? ""),
    accessCode: String(formData.get("accessCode") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors, error: parsed.error.issues[0]?.message };
  }

  const player = await db.player.findUnique({
    where: { inviteCode: normalizeInviteCode(parsed.data.inviteCode) },
    select: {
      id: true,
      name: true,
      accessCode: true,
      tournamentId: true,
    },
  });

  // One generic message for both branches: never reveal which half was wrong.
  const rejection: ActionState = {
    ok: false,
    error: "That invitation and access code pair does not match.",
  };

  if (!player) return rejection;
  if (player.accessCode !== parsed.data.accessCode) return rejection;

  resetRateLimit(`player:${ip}`);

  await setSession({
    role: "player",
    playerId: player.id,
    tournamentId: player.tournamentId,
    name: player.name,
  });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
