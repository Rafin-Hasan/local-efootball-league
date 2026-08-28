import { z } from "zod";

export const playerDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(40, "Name must be 40 characters or fewer"),
  clubName: z
    .string()
    .trim()
    .max(40, "Club must be 40 characters or fewer")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const createTournamentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Tournament name must be at least 3 characters")
      .max(60, "Tournament name must be 60 characters or fewer"),
    startDate: z.coerce.date({ message: "Start date is required" }),
    endDate: z.coerce.date({ message: "End date is required" }),
    rules: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
    players: z
      .array(playerDraftSchema)
      .min(2, "Add at least 2 players")
      .max(200, "A tournament supports at most 200 players"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const names = data.players.map((p) => p.name.toLowerCase());
      return new Set(names).size === names.length;
    },
    { message: "Player names must be unique", path: ["players"] },
  );

export const playerLoginSchema = z.object({
  inviteCode: z.string().trim().min(4, "Invitation code is required"),
  accessCode: z
    .string()
    .trim()
    .regex(/^\d{3}$/, "Access code must be exactly 3 digits"),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
