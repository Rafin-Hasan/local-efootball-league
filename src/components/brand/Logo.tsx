import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * The supplied logo is a square PNG on a black field.
 *
 * Against the pale glass of the nav capsule that field would read as a stray
 * dark blob, so the mark is presented as a deliberate inset chip: a rounded
 * tile with a glass rim and a bright top lip, matching the surrounding
 * material rather than fighting it.
 *
 * `sizes` has to account for both the 1.35 crop scale and device pixel ratio.
 * Passing the CSS size alone made Next serve a 32px-wide file for a 43px box
 * from a 2000px source, which upscaled into a visibly soft mark.
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
        "relative block overflow-hidden rounded-xl bg-deep-950/70",
        "ring-1 ring-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/media/logo.png"
        alt="Local eFootball League"
        fill
        sizes={`${Math.ceil(size * 1.35 * 3)}px`}
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
      <span className="text-brand-300">#</span>
      <span>Local</span>
      <span className="text-brand-300">eFootball</span>
    </span>
  );
}
