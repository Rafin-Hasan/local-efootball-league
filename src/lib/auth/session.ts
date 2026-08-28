import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kickoff_session";
const ISSUER = "kickoff-os";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Session =
  | { role: "admin"; tournamentId: string }
  | { role: "player"; playerId: string; tournamentId: string; name: string };

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. See .env.example.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

/** Edge- and Node-safe: no database access, signature check only. */
export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    if (payload.role === "admin" && typeof payload.tournamentId === "string") {
      return { role: "admin", tournamentId: payload.tournamentId };
    }
    if (
      payload.role === "player" &&
      typeof payload.playerId === "string" &&
      typeof payload.tournamentId === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        role: "player",
        playerId: payload.playerId,
        tournamentId: payload.tournamentId,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

/** Read the session inside Server Components and Server Actions. */
export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
