"use client";

import { clsx } from "@/lib/clsx";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-semibold text-ink-700"
      >
        {children}
      </label>
      {hint ? <span className="text-[12px] text-ink-500">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-brand-300">
      {children}
    </p>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "info";
}) {
  const error = tone === "error";

  return (
    <div
      role={error ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-medium",
        error
          ? "border-brand-400/40 bg-brand-500/15 text-brand-300"
          : "border-white/10 bg-white/[0.06] text-ink-600",
      )}
    >
      {/* Inline SVG rather than a glyph: emoji render differently on every
          platform and carry no reliable size or colour. */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="6.5" />
        {error ? (
          <>
            <path d="M8 4.8v3.8" />
            <path d="M8 11.1h.01" />
          </>
        ) : (
          <>
            <path d="M8 7.4v3.8" />
            <path d="M8 4.9h.01" />
          </>
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
}
