import { clsx } from "@/lib/clsx";

function formatRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${fmt.format(start)} — ${fmt.format(end)}`;
}

/**
 * Compact rules strip. Server-rendered: the rule text is tournament data, not
 * a client concern, and it should be in the HTML for crawlers and screen
 * readers on first paint.
 */
export function RulesBanner({
  name,
  startDate,
  endDate,
  rules,
  playerCount,
  className,
}: {
  name: string;
  startDate: Date;
  endDate: Date;
  rules: string[];
  playerCount: number;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "panel specular relative overflow-hidden rounded-[1.75rem]",
        className,
      )}
    >
      <div className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:w-64 lg:shrink-0">
          <span className="chip bg-aqua-500 text-deep-950">Tournament</span>
          <h2 className="display mt-2.5 text-2xl leading-tight text-ink">
            {name}
          </h2>
          <dl className="mt-3 space-y-1 text-[13px] text-ink-500">
            <div className="flex gap-2">
              <dt className="font-semibold text-ink-600">Window</dt>
              <dd>{formatRange(startDate, endDate)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-ink-600">Entrants</dt>
              <dd>
                {playerCount} player{playerCount === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-400">
            Rules of the league
          </h3>

          {rules.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-ink-500">
              No rules published yet. An admin can add them from the admin panel.
            </p>
          ) : (
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex gap-2.5 rounded-2xl border border-white/10 bg-deep-800 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]"
                >
                  <span className="mt-px shrink-0 font-bold tabular-nums text-aqua-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
