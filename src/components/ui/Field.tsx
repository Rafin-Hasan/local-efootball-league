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
      {hint ? <span className="text-[12px] text-ink-400">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-brand-600">
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
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[13px] font-medium",
        tone === "error"
          ? "border-brand-300/60 bg-brand-50/70 text-brand-700 backdrop-blur"
          : "border-white/70 bg-white/60 text-ink-700 backdrop-blur",
      )}
    >
      <span aria-hidden className="mt-px select-none">
        {tone === "error" ? "⚠" : "ℹ"}
      </span>
      <span>{children}</span>
    </div>
  );
}
