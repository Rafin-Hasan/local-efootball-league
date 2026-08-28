/**
 * Development seed: a realistic mid-season league so every board on the home
 * page has something to render.
 *
 * Deterministic — a fixed PRNG seed means the same scorelines every run, so
 * screenshots and manual QA stay comparable. Wipes the existing tournament
 * first; never run this against production data.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateInviteCode, generateUniqueAccessCodes } from "../src/lib/codes";
import { generateRoundRobin } from "../src/lib/engine/fixtures";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Mulberry32 — small, fast, and reproducible from a single integer seed. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROSTER = [
  { name: "Arif Hossain", clubName: "Inter Milan" },
  { name: "Bilal Rahman", clubName: "Inter Milan" },
  { name: "Chowdhury Ali", clubName: "Real Madrid" },
  { name: "Dipu Sarkar", clubName: "Real Madrid" },
  { name: "Emon Khan", clubName: "Man City" },
  { name: "Farhan Islam", clubName: "Man City" },
  { name: "Gazi Noman", clubName: "Bayern" },
  { name: "Hasib Alam", clubName: "Bayern" },
];

const RULES = [
  "Every fixture is a 1v1 head-to-head on eFootball.",
  "Win = 3 points · Draw = 1 point · Loss = 0 points.",
  "Report your score to the admin immediately after full time.",
  "A no-show inside 15 minutes of kickoff is a 3-0 forfeit.",
  "Squad ratings refresh the moment a result is submitted.",
  "Ties are split by goal difference, then goals scored, then head-to-head.",
];

async function main() {
  const rng = makeRng(20260828);

  console.log("Clearing existing tournaments…");
  await db.tournament.deleteMany();

  const start = new Date();
  start.setDate(start.getDate() - 21);
  const end = new Date();
  end.setDate(end.getDate() + 18);

  const codes = generateUniqueAccessCodes(ROSTER.length);

  const tournament = await db.tournament.create({
    data: {
      name: "Local eFootball League — Season 1",
      startDate: start,
      endDate: end,
      rules: RULES,
      players: {
        create: ROSTER.map((player, index) => ({
          name: player.name,
          clubName: player.clubName,
          accessCode: codes[index],
          inviteCode: generateInviteCode(),
        })),
      },
    },
    include: { players: true },
  });

  const players = tournament.players;
  const fixtures = generateRoundRobin(players.map((p) => p.id));

  // Play roughly the first two thirds of the season.
  const playedThrough = Math.ceil((players.length - 1) * 0.66);

  const data = fixtures.map((fixture) => {
    const isPlayed = fixture.round <= playedThrough;
    if (!isPlayed) {
      return {
        tournamentId: tournament.id,
        round: fixture.round,
        homePlayerId: fixture.homePlayerId,
        awayPlayerId: fixture.awayPlayerId,
        status: "SCHEDULED" as const,
      };
    }

    // Poisson-ish scoreline: mostly 0-3 goals, occasionally more.
    const goals = () => Math.floor(rng() * rng() * 6);
    const playedAt = new Date(start);
    playedAt.setDate(playedAt.getDate() + fixture.round * 3);

    return {
      tournamentId: tournament.id,
      round: fixture.round,
      homePlayerId: fixture.homePlayerId,
      awayPlayerId: fixture.awayPlayerId,
      homeGoals: goals(),
      awayGoals: goals(),
      status: "PLAYED" as const,
      playedAt,
    };
  });

  await db.match.createMany({ data });

  const playedCount = data.filter((m) => m.status === "PLAYED").length;
  console.log(
    `Seeded "${tournament.name}": ${players.length} players, ` +
      `${data.length} fixtures (${playedCount} played).`,
  );
  console.log("\nSign in as a player with any of these pairs:\n");
  for (const player of players) {
    console.log(
      `  ${player.name.padEnd(18)} invite ${player.inviteCode}   code ${player.accessCode}`,
    );
  }
  console.log(
    `\nAdmin: open /login, pick the Admin tab, then reopen "${tournament.name}".\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
