"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Hero background video.
 *
 * The source file is ~7.8MB, so it is NOT part of the initial load: the poster
 * paints immediately, and the video only starts fetching once the hero is
 * actually near the viewport. `preload="none"` plus a deferred `src` is what
 * makes that real — setting `preload` alone still lets some browsers fetch.
 *
 * Autoplay stays best-effort. If the browser blocks it, or the user has asked
 * for reduced motion, the poster remains and a play control appears rather
 * than leaving a dead rectangle.
 */
export function HeroVideo({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const reduced = useReducedMotion();

  // Parallax: the footage drifts slower than the page, like looking down
  // through water. Transform-only, so it stays on the compositor.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    // Start fetching a little before the hero is on screen, not on mount.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!shouldLoad) return;
    videoRef.current?.play().catch(() => setBlocked(true));
  }, [shouldLoad]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-deep-950"
    >
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduced ? undefined : { y: videoY }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={shouldLoad ? "/media/hero.mp4" : undefined}
          poster="/media/hero-poster.webp"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          tabIndex={-1}
        />
      </motion.div>

      {/* Scrim: keeps headline contrast legible whatever the footage shows. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-deep-950/90 via-deep-950/75 to-deep-950"
      />
      {/* A cool cast over the footage so it belongs to the water palette. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(110%_75%_at_30%_25%,rgba(225, 29, 42,0.16)_0%,rgba(2,6,9,0.92)_75%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32 lg:py-40"
      >
        {children}
      </motion.div>

      {blocked || (reduced && !shouldLoad) ? (
        <button
          type="button"
          onClick={() => {
            setShouldLoad(true);
            videoRef.current?.play().then(
              () => setBlocked(false),
              () => undefined,
            );
          }}
          className="panel-over absolute bottom-5 right-5 z-10 rounded-full px-4 py-2 text-xs
                     font-semibold text-ink transition hover:bg-white/[0.08]"
        >
          <svg
            aria-hidden
            viewBox="0 0 10 12"
            className="mr-1.5 inline-block h-2.5 w-2.5 fill-current align-[-1px]"
          >
            <path d="M0 0l10 6-10 6z" />
          </svg>
          Play showreel
        </button>
      ) : null}
    </section>
  );
}
