# KickOff OS

Tournament operating system for the **#Local eFootball League** — a 1v1 league
where every head-to-head result feeds three live races: the Golden Boot (goals),
the Golden Ball (player rating) and the Winner Race (team points).

Built with Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion and
Prisma on Postgres, in a **Liquid Water** theme: layered translucent surfaces
over a slow caustic drift, with scroll-linked motion throughout.

---

## Status

| Page | What it does |
| --- | --- |
| `/login` | Player tab (invite code + PIN) and Admin tab (create a tournament, or reopen one) |
| `/` | Hero video, rules banner, live countdown, Golden Boot / Golden Ball / Winner race sliders |
| `/fixtures` | Every 1v1 grouped by gameweek, filterable by round, status and "my matches" |
| `/standings` | Live player table and team table, with ratings, form and animated reordering |
| `/dashboard` | Team hub — KPIs, cumulative points trend, per-player contribution, roster |
| `/stats` | Personal portfolio — rating dial, ranks, results split, match history, next fixtures |
| `/admin` | AI copilot, fixture generator, score entry, roster and access codes |

All eight routes are built. Players see their own team and their own stats; admins
can switch to any team or player, and reach `/admin`.

---

## Getting started

```bash
npm install
```

### 1. Database

Local development uses Prisma's bundled Postgres — no account needed:

```bash
npx prisma dev -d -n kickoff
```

Copy `.env.example` to `.env`, then set `DATABASE_URL` to the **TCP** URL that
`npx prisma dev ls` prints (it looks like
`postgres://postgres:postgres@localhost:PORT/template1?sslmode=disable`).
Use the TCP URL, not the `prisma+postgres://` one — the app connects through the
`@prisma/adapter-pg` driver adapter.

For deployment, replace it with a Neon pooled connection string.

### 2. Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put that in `SESSION_SECRET`. There is no admin password — see below.

### 3. Migrate, seed, run

```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The seed prints every player's invitation code and 3-digit access code.

---

## Signing in

Everything sits behind the login wall — only `/login` is reachable signed out.

**Admin** → the Admin tab *is* the tournament setup form: name, start and end
dates, rule lines and the player roster. Submitting creates the tournament,
issues every player a unique invitation code and a 3-digit PIN, and signs you in
as its admin. If tournaments already exist, the tab also lists them, so an admin
who closed the browser can reopen one.

> **This side is deliberately unauthenticated.** Anyone who reaches `/login` can
> create a tournament, or open an existing one as its admin — which means editing
> scores and reading every player's codes. Only per-IP rate limiting stands in the
> way. That is fine for a private league on a link you control; put the deployment
> behind access control before pointing strangers at it.

**Player** → the Player tab, with the invitation code *and* the 3-digit PIN.
Passwordless, no account. The invitation code is unguessable, which is what
makes a 3-digit PIN safe: it namespaces a space that would otherwise be 1000
guesses wide. Failed attempts are rate-limited per IP, and the error never
reveals which half was wrong.

---

## How scoring works

Standings and ratings are **never stored**. They are derived on every read from
`Match` rows by pure reducers in `src/lib/engine/`, which is what makes "live
recalculation" honest rather than a cache-invalidation story.

- **`scoring.ts`** — win/draw/loss primitives, 3/1/0 points.
- **`standings.ts`** — reduces matches into per-player rows (W/D/L, goals,
  clean sheets, form), then rolls players up into club rows. Tiebreaks run
  points → goal difference → goals scored → head-to-head → name.
- **`fixtures.ts`** — circle-method round robin, one or two legs. Regeneration is
  non-destructive: played results are kept and never duplicated, only the
  scheduled tail is rebuilt, so the admin can press the button as often as they
  like.
- **`ratings.ts`** — the Golden Ball score. Win rate, goal difference, clean
  sheets and scoring rate combine into a 0–10 rating, then shrink toward the
  5.0 baseline based on appearances, so one lucky win cannot outrank a strong
  ten-match record. Goal difference and goals are capped so a single rout
  cannot dominate.

```bash
npm run test    # 38 tests over the engine
```

---

## The Liquid Water theme

The reference is light through deep water: layered translucent surfaces that
refract what floats behind them, a slow caustic drift on the page itself, and
highlights that travel like a swell passing underneath.

Three rules hold it together:

1. **Glass refracts something.** Every translucent surface sits over the caustic
   field or over video, never over flat colour — a blur with nothing behind it
   is wasted GPU.
2. **Depth is translucency and blur, not drop shadow.**
3. **Dense reading surfaces are not glass.** `.panel-inset` is deliberately
   opaque: a blurred backdrop behind small tabular figures costs legibility and
   GPU for no gain. That is the Liquid Glass style's own documented limit, so
   the standings and score tables opt out of it.

Two colour ramps do the work and cannot be confused: `deep` (950 → 500) is only
ever a background, `ink` (DEFAULT → 200) is only ever text. Accents are split by
meaning rather than taste — `aqua` carries every interactive and positive
signal, and `brand` red is reserved for the mark itself plus live and losing
states. Red on cyan is a complementary pair, so the few red things stay loud
precisely because everything else is cool.

Materials in `src/app/globals.css`: `.panel`, `.panel-raised` (overlapping),
`.panel-inset` (opaque data wells), `.panel-over` (content on video), `.rail`,
`.accent-bar` and `.specular`. The `.caustics` layer animates `transform` and
`opacity` only, under `contain: strict`, so it runs on the compositor and never
triggers layout or paint.

**Type** is the Barlow family at two widths — Barlow Condensed for display,
Barlow for body. `.display` is upright, because italic tabular figures are hard
to scan in the standings; slant is opt-in via `.display-slant`, and
`.scoreboard` handles figures.

Direction and font pairing came from the `ui-ux-pro-max` skill (Liquid Glass
style, Sports/Fitness pairing). The palette is a composed dark variant — the
skill's water palettes are all light-mode, so it is not a database match.

---

## Motion

Scroll behaviour lives in `src/components/motion/`, so timings are decided once
rather than per page.

- **`Reveal` / `RevealGroup` / `RevealItem`** — `whileInView` reveals. The
  viewport threshold is deliberately tiny (`amount: 0.05`): a tall block must
  reveal as soon as any part of it enters, or it can sit invisible on a short
  page. Content that never appears is worse than no animation.
- **`ScrollProgress`** — a hairline in the nav rail driven by `useScroll` into a
  `useSpring`. It writes to a motion value, so scrolling never re-renders React.
- **Hero parallax** — `useScroll` + `useTransform` drift the footage and fade the
  headline as you leave the hero.

Every one of these reads `useReducedMotion()` and collapses to a plain fade (or
nothing) when the user has asked for less motion. Only `transform` and `opacity`
are animated, so they stay on the compositor.

---

## Performance notes

The hero video was the whole story. It shipped as 720x720 at 60fps and
**8.1 Mbps** — 7.9 MB for an eight-second muted loop that is heavily scrimmed
anyway.

| | Before | After |
| --- | --- | --- |
| `hero.mp4` | 7,933 KB | 524 KB |
| `public/media` total | 8.1 MB | 944 KB |

Re-encoded to 30fps at CRF 30 with `+faststart`. A VP9 WebM was also tried and
came out **larger** (1,115 KB) than the H.264, so it was dropped rather than
shipped for its own sake.

The video is also no longer on the critical path: `preload="none"` plus a
deferred `src` means the 84 KB poster paints first and the file only starts
fetching once an `IntersectionObserver` says the hero is near the viewport — so
it never loads at all on the other six pages.

Other measures: `optimizePackageImports` for `framer-motion`,
`content-visibility` on the long match-history and roster lists (`.list-virtual`),
and one fewer font weight.

Honest caveat: **First Load JS grew ~6 KB** (152 KB vs 146 KB) for the scroll
hooks. `LazyMotion` was evaluated and rejected — `layout`/`layoutId` animations
need the `domMax` feature bundle, which saves roughly 3 KB over the full import
and is not worth degrading the animation for.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run test` | Engine unit tests |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Reset and reseed the demo league |
| `npm run db:studio` | Prisma Studio |
| `npm run clean` | Delete `.next` |
| `npm run dev:clean` | Clean, then start the dev server |

> Do not run `npm run build` while `npm run dev` is running. The production
> build overwrites `.next`, and the running dev server then cannot resolve
> chunks for routes it has not already compiled: the page you are on keeps
> working while every link to another route fails with
> `Failed to fetch RSC payload`. If that happens, stop the dev server and run
> `npm run dev:clean`.

---

## The AI copilot

`/admin` carries a copilot that answers questions about the live tournament —
standings, form, fixtures, the title race. The whole league state is small
enough to pass in the prompt, so there is no retrieval step to get wrong.

Set `ANTHROPIC_API_KEY` in `.env` for real analysis; the model defaults to
`claude-opus-5` and can be overridden with `ANTHROPIC_MODEL`. Responses stream
token by token.

Without a key the panel falls back to `src/lib/ai/mock.ts`, which builds a
templated briefing from the same figures and labels itself **Offline** in the
UI. That keeps the page working on a machine with no key without pretending a
model wrote it. The route is admin-only and rate-limited.

---

## Notes

- `jose` triggers two Edge Runtime warnings at build time (`CompressionStream`,
  `DecompressionStream`). They come from the JWE decrypt path, which this app
  never uses; the middleware only verifies HS256 signatures.
- There is no admin password. The Admin tab creates a tournament outright, and
  can reopen any existing one. See the warning under **Signing in**.
- A tournament's 3-digit PINs are unique within that tournament only
  (`@@unique([tournamentId, accessCode])`), so several tournaments coexist
  without exhausting the 1000-code space. Invitation codes are globally unique,
  which is what makes them the lookup key at sign-in.
