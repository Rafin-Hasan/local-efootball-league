import { randomInt, randomBytes } from "node:crypto";

/** Unambiguous alphabet — no O/0, I/1, so codes survive being read aloud. */
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_LENGTH = 8;

/** A 3-digit PIN, "000".."999", zero-padded. */
export function generateAccessCode(): string {
  return String(randomInt(0, 1000)).padStart(3, "0");
}

/** e.g. "LFL-7K2QX9P4" — unguessable, so it namespaces the tiny PIN space. */
export function generateInviteCode(): string {
  const bytes = randomBytes(INVITE_LENGTH);
  let out = "";
  for (let i = 0; i < INVITE_LENGTH; i += 1) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return `LFL-${out}`;
}

/**
 * Draw `count` distinct 3-digit PINs. Only 1000 exist, so a tournament cannot
 * exceed that; the caller surfaces this as a validation error.
 */
export function generateUniqueAccessCodes(
  count: number,
  taken: Iterable<string> = [],
): string[] {
  const used = new Set(taken);
  if (count > 1000 - used.size) {
    throw new Error(
      `Only ${1000 - used.size} unique 3-digit codes remain; cannot issue ${count}.`,
    );
  }
  const codes: string[] = [];
  while (codes.length < count) {
    const code = generateAccessCode();
    if (used.has(code)) continue;
    used.add(code);
    codes.push(code);
  }
  return codes;
}

export function normalizeInviteCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  return cleaned.startsWith("LFL-") ? cleaned : `LFL-${cleaned.replace(/^-+/, "")}`;
}
