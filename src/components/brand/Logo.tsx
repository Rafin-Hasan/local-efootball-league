import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * The supplied logo is a square PNG on a black field. On the dark theme that
 * field is nearly the page colour, so the mark now sits directly on the page
 * with no tile around it — the crop just trims the PNG's generous margins.
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
      className={clsx("relative block overflow-hidden rounded-xl", className)}
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

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "display-slant inline-flex items-baseline gap-1.5 leading-none text-ink",
        className,
      )}
    >
      <span className="text-aqua-300">#</span>
      <span>Local</span>
      <span className="text-aqua-300">eFootball</span>
    </span>
  );
}
