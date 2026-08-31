/**
 * Pre-flight for the deploy build.
 *
 * Without this, a missing or blank DATABASE_URL surfaces as Prisma's
 * "Connection url is empty" — accurate, but it tells you nothing about which
 * variable, in which environment, on which platform. A deploy is exactly where
 * that context is hardest to recover, so fail here with the fix instead.
 *
 * Only variables the app cannot start without are checked. The Anthropic key
 * is deliberately absent: the copilot degrades to templated summaries without
 * it, which is a supported mode, not a misconfiguration.
 */

// Load .env the same way prisma.config.ts does, so running the deploy build
// locally checks the same values the migration step will actually use. On a
// hosting platform there is no .env and this is a no-op — the platform's own
// environment is already populated.
try {
  await import("dotenv/config");
} catch {
  // dotenv is a dev dependency; its absence just means no .env to load.
}

const REQUIRED = [
  {
    name: "DATABASE_URL",
    hint: "A Postgres connection string. On Vercel use a hosted database (Neon's pooled URL); a localhost URL is unreachable from the build.",
    check: (v) => /^postgres(ql)?:\/\//.test(v),
    checkHint: "must start with postgres:// or postgresql://",
  },
  {
    name: "SESSION_SECRET",
    hint: "Signs session cookies. Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    check: (v) => v.length >= 32,
    checkHint: "must be at least 32 characters",
  },
];

const problems = [];

for (const { name, hint, check, checkHint } of REQUIRED) {
  const raw = process.env[name];

  // An empty or whitespace-only value is a misconfiguration, not a value.
  // Vercel stores a variable added with a blank value as "", which is the
  // single most confusing way for this to fail.
  if (raw === undefined) {
    problems.push(`${name} is not set.\n    ${hint}`);
    continue;
  }
  if (raw.trim() === "") {
    problems.push(
      `${name} is set but empty.\n    ${hint}\n    (On Vercel, check the variable actually has a value saved, and that it is enabled for the environment you are deploying to.)`,
    );
    continue;
  }
  if (check && !check(raw.trim())) {
    problems.push(`${name} looks wrong — ${checkHint}.\n    ${hint}`);
  }
}

if (problems.length > 0) {
  const lines = [
    "",
    "  Build stopped: required environment variables are missing or invalid.",
    "",
    ...problems.map((p, i) => `  ${i + 1}. ${p}`),
    "",
    "  Set these in your hosting provider's environment settings and redeploy.",
    "  See the Deploying section of README.md.",
    "",
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

console.log("Environment check passed.");
