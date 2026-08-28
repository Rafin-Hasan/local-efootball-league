"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Muted, looping background video. Autoplay is best-effort: if the browser or
 * a reduced-motion preference blocks it, the first frame stays as a still and
 * a play control appears rather than leaving a dead black rectangle.
 */
export function HeroVideo({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setBlocked(true);
      return;
    }
    video.play().catch(() => setBlocked(true));
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/media/hero.mp4"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        tabIndex={-1}
      />

      {/* Scrim: keeps headline contrast legible whatever the footage shows. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink/90"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_35%,rgba(11,11,13,0.65)_100%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32 lg:py-40"
      >
        {children}
      </motion.div>

      {blocked ? (
        <button
          type="button"
          onClick={() => {
            videoRef.current?.play().then(
              () => setBlocked(false),
              () => undefined,
            );
          }}
          className="absolute bottom-5 right-5 z-10 rounded-full bg-white/12 px-4 py-2 text-xs
                     font-semibold text-white backdrop-blur transition hover:bg-white/20"
        >
          ▶ Play showreel
        </button>
      ) : null}
    </section>
  );
}
