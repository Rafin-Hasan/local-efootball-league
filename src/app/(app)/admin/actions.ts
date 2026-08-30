"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { generateInviteCode, generateUniqueAccessCodes } from "@/lib/codes";
import { db } from "@/lib/db";
import { generateRoundRobin, planRegeneration } from "@/lib/engine/fixtures";
import { playerDraftSchema } from "@/lib/validation";

export type AdminActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

/**
 * Every action re-checks the session server-side. Middleware already gates
 * /admin, but a Server Action is a public endpoint — the route guard is not
 * an authorisation check for the mutation itself.
 */
async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Not authorised.");
  }
  return session.tournamentId;
}

function refresh(): void {
  for (const path of ["/", "/fixtures", "/standings", "/dashboard", "/stats", "/admin"]) {
    revalidatePath(path);
  }
}

/* ------------------------------------------------------------- fixtures */

const generateSchema = z.object({ legs: z.union([z.literal(1), z.literal(2)]) });

export async function generateFixturesAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const tournamentId = await requireAdmin();

    const parsed = generateSchema.safeParse({
      legs: Number(formData.get("legs") ?? 1),
    });
    if (!parsed.success) return { ok: false, error: "Choose one or two legs." };

    const players = await db.player.findMany({
      where: { tournamentId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (players.length < 2) {
      return { ok: false, error: "Add at least 2 players before generating." };
    }

    const existing = await db.match.findMany({
      where: { tournamentId },
      select: {
        id: true,
        round: true,
        homePlayerId: true,
        awayPlayerId: true,
        status: true,
      },
    });

    const drafts = generateRoundRobin(
      players.map((p) => p.id),
      { legs: parsed.data.legs },
    );
    const plan = planRegeneration(existing, drafts);

    // One transaction: never leave the schedule half-rebuilt.
    await db.$transaction([
      db.match.deleteMany({ where: { id: { in: plan.deleteIds } } }),
      db.match.createMany({
        data: plan.create.map((draft) => ({ tournamentId, ...draft })),
      }),
    ]);

    refresh();
    return {
      ok: true,
      message:
        `Generated ${plan.create.length} fixtures across ` +
        `${new Set(plan.create.map((d) => d.round)).size} gameweeks. ` +
        `${plan.keptPlayed} played result${plan.keptPlayed === 1 ? "" : "s"} kept.`,
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/* ---------------------------------------------------------------- scores */

const scoreSchema = z.object({
  matchId: z.string().min(1),
  homeGoals: z.coerce.number().int().min(0).max(99),
  awayGoals: z.coerce.number().int().min(0).max(99),
});

export async function submitScoreAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const tournamentId = await requireAdmin();

    const parsed = scoreSchema.safeParse({
      matchId: String(formData.get("matchId") ?? ""),
      homeGoals: String(formData.get("homeGoals") ?? ""),
      awayGoals: String(formData.get("awayGoals") ?? ""),
    });
    if (!parsed.success) {
      return { ok: false, error: "Enter whole numbers between 0 and 99." };
    }

    const { matchId, homeGoals, awayGoals } = parsed.data;

    // Scope the update to this tournament so a stray id cannot reach another.
    const match = await db.match.findFirst({
      where: { id: matchId, tournamentId },
      select: { id: true },
    });
    if (!match) return { ok: false, error: "That fixture no longer exists." };

    await db.match.update({
      where: { id: matchId },
      data: {
        homeGoals,
        awayGoals,
        status: "PLAYED",
        playedAt: new Date(),
      },
    });

    refresh();
    return { ok: true, message: `Score saved: ${homeGoals}–${awayGoals}.` };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function clearScoreAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const tournamentId = await requireAdmin();
    const matchId = String(formData.get("matchId") ?? "");

    const match = await db.match.findFirst({
      where: { id: matchId, tournamentId },
      select: { id: true },
    });
    if (!match) return { ok: false, error: "That fixture no longer exists." };

    await db.match.update({
      where: { id: matchId },
      data: {
        homeGoals: null,
        awayGoals: null,
        status: "SCHEDULED",
        playedAt: null,
      },
    });

    refresh();
    return { ok: true, message: "Result cleared; fixture back to scheduled." };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/* --------------------------------------------------------------- roster */

export async function addPlayerAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const tournamentId = await requireAdmin();

    const parsed = playerDraftSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      clubName: String(formData.get("clubName") ?? ""),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid player." };
    }

    const taken = await db.player.findMany({
      where: { tournamentId },
      select: { accessCode: true, name: true },
    });

    const clash = taken.some(
      (p) => p.name.toLowerCase() === parsed.data.name.toLowerCase(),
    );
    if (clash) {
      return { ok: false, error: "A player with that name already exists." };
    }

    const [accessCode] = generateUniqueAccessCodes(
      1,
      taken.map((p) => p.accessCode),
    );

    await db.player.create({
      data: {
        tournamentId,
        name: parsed.data.name,
        clubName: parsed.data.clubName ?? null,
        accessCode,
        inviteCode: generateInviteCode(),
      },
    });

    refresh();
    return {
      ok: true,
      message: `${parsed.data.name} added. Regenerate fixtures to include them.`,
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function removePlayerAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const tournamentId = await requireAdmin();
    const playerId = String(formData.get("playerId") ?? "");

    const player = await db.player.findFirst({
      where: { id: playerId, tournamentId },
      select: { id: true, name: true },
    });
    if (!player) return { ok: false, error: "That player no longer exists." };

    // Cascades to their matches, played ones included — this is destructive
    // and the UI asks for confirmation before calling it.
    await db.player.delete({ where: { id: playerId } });

    refresh();
    return { ok: true, message: `${player.name} removed from the tournament.` };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function rotateCodesAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const tournamentId = await requireAdmin();
    const playerId = String(formData.get("playerId") ?? "");

    const player = await db.player.findFirst({
      where: { id: playerId, tournamentId },
      select: { id: true, name: true },
    });
    if (!player) return { ok: false, error: "That player no longer exists." };

    const taken = await db.player.findMany({
      where: { tournamentId, NOT: { id: playerId } },
      select: { accessCode: true },
    });

    const [accessCode] = generateUniqueAccessCodes(
      1,
      taken.map((p) => p.accessCode),
    );

    await db.player.update({
      where: { id: playerId },
      data: { accessCode, inviteCode: generateInviteCode() },
    });

    refresh();
    return {
      ok: true,
      message: `New codes issued for ${player.name}. Their old codes no longer work.`,
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
