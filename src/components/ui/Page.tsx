import { clsx } from "@/lib/clsx";

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <span className="chip bg-aqua-500/15 text-aqua-300 ring-1 ring-aqua-400/40">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="display mt-2.5 text-4xl leading-none text-ink sm:text-5xl">
          {title}
        </h1>
        {lead ? (
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-500">
            {lead}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-28 pt-10 md:pb-24">{children}</main>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = "ink",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "ink" | "aqua" | "gold" | "win";
}) {
  const tone = {
    ink: "text-ink",
    aqua: "text-aqua-300",
    gold: "text-gold-300",
    win: "text-win",
  }[accent];

  return (
    <div className="card specular p-4">
      <div className="strap">
        {label}
      </div>
      <div className={clsx("scoreboard mt-1.5 text-4xl tabular-nums", tone)}>
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[12.5px] text-ink-500">{sub}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <p className="display text-2xl text-ink-600">{title}</p>
      {children ? (
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-500">
          {children}
        </p>
      ) : null}
    </div>
  );
}

const FORM_TONE = {
  W: "bg-win",
  D: "bg-draw",
  L: "bg-loss",
} as const;

const FORM_TITLE = { W: "Win", D: "Draw", L: "Loss" } as const;

/** Recent results, newest first. Empty renders a muted dash, not nothing. */
export function FormPills({
  form,
  size = "md",
}: {
  form: ("W" | "D" | "L")[];
  size?: "sm" | "md";
}) {
  if (form.length === 0) {
    return <span className="text-[12px] text-ink-500">—</span>;
  }
  return (
    <span className="inline-flex gap-1" aria-label="Recent form, newest first">
      {form.map((result, i) => (
        <span
          key={i}
          title={FORM_TITLE[result]}
          className={clsx(
            "grid place-items-center rounded font-bold text-white",
            size === "sm" ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[10px]",
            FORM_TONE[result],
          )}
        >
          {result}
        </span>
      ))}
    </span>
  );
}

/** Circular initials badge, coloured deterministically from the name. */
export function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        backgroundImage: `linear-gradient(150deg, hsl(${hue} 58% 62%), hsl(${(hue + 40) % 360} 54% 46%))`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
