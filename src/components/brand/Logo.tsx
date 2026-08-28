import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * The supplied logo is a square PNG on a black field with generous margins.
 * `LogoMark` crops into it inside a dark tile so it reads as intentional on a
 * light page; `Wordmark` is the typographic stand-in for tight UI chrome.
 */
export function LogoMark({
  className,
  size = 96,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <span
      className={clsx(
        "relative block overflow-hidden rounded-2xl bg-ink ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/media/logo.png"
        alt="Local eFootball League"
        fill
        sizes={`${size}px`}
        priority={priority}
        className="scale-[1.35] object-contain"
      />
    </span>
  );
}

export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={clsx(
        "display inline-flex items-baseline gap-1.5 leading-none",
        tone === "light" ? "text-white" : "text-ink",
        className,
      )}
    >
      <span className="text-brand-500">#</span>
      <span>Local</span>
      <span className="text-brand-500">eFootball</span>
    </span>
  );
}
