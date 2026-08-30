"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/clsx";

const PRESETS: { id: string; label: string; question: string }[] = [
  {
    id: "recap",
    label: "Recap latest gameweek",
    question:
      "Write a short recap of the most recent completed gameweek: the standout results, the biggest margin, and what changed at the top of the table.",
  },
  {
    id: "title",
    label: "Who wins the title?",
    question:
      "Given the current standings and the fixtures still to play, who is best placed to win the league and why? Name the main threat to them.",
  },
  {
    id: "form",
    label: "Who is in form?",
    question:
      "Which players are in the best and worst form right now? Use their recent results and ratings, and flag anyone whose rating is being held down by a small sample.",
  },
  {
    id: "boot",
    label: "Golden Boot outlook",
    question:
      "How does the Golden Boot race look? Compare the leaders on goals per match, not just totals, and say who is most likely to finish top.",
  },
];

type Mode = "live" | "offline" | null;

export function Copilot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(text: string, preset?: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPending(true);
    setError(null);
    setAnswer("");
    setMode(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed, preset }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? `Request failed (${response.status}).`);
        return;
      }

      setMode(
        response.headers.get("x-copilot-mode") === "offline"
          ? "offline"
          : "live",
      );

      const reader = response.body?.getReader();
      if (!reader) {
        setAnswer(await response.text());
        return;
      }

      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card specular p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="display text-2xl text-ink">Tournament copilot</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">
            Asks Claude about the live state of this tournament — standings,
            form, fixtures and ratings.
          </p>
        </div>
        {mode ? (
          <span
            className={clsx(
              "chip ring-1",
              mode === "live"
                ? "bg-win/15 text-win ring-win/30"
                : "control text-ink-500",
            )}
          >
            {mode === "live" ? "Live · Claude" : "Offline · templated"}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={pending}
            onClick={() => {
              setQuestion(preset.question);
              void ask(preset.question, preset.id);
            }}
            className="control rounded-xl px-3 py-1.5 text-[12.5px] font-semibold text-ink-600 ring-1 ring-white/10 transition hover:bg-white/[0.10] disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={600}
          placeholder="Ask anything about this tournament…"
          className="field flex-1"
          aria-label="Question for the tournament copilot"
        />
        <button
          type="submit"
          disabled={pending || question.trim().length === 0}
          className="btn-primary sm:w-32"
        >
          {pending ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-[13px] font-medium text-brand-300">
          {error}
        </p>
      ) : null}

      {answer || pending ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 well rounded-2xl px-4 py-3.5"
        >
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700">
            {answer}
            {pending ? (
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand-500 align-text-bottom" />
            ) : null}
          </p>
        </motion.div>
      ) : null}

      {mode === "offline" ? (
        <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
          No <code className="font-mono">ANTHROPIC_API_KEY</code> is configured,
          so this answer was generated from a template over the same figures —
          not by a model. Set the key in{" "}
          <code className="font-mono">.env</code> for real analysis.
        </p>
      ) : null}
    </section>
  );
}
