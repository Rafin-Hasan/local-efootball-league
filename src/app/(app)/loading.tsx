import { PageShell } from "@/components/ui/Page";

/**
 * Shown the instant a navigation starts, while the server renders the page.
 *
 * Next only paints something mid-navigation if there is a Suspense boundary to
 * fall back to; without this file the router holds the old page on screen and
 * the app feels frozen until the response lands. The shapes deliberately match
 * the real layout — a header block then a row of tiles — so the swap reads as
 * the content arriving rather than the page jumping.
 */
export default function Loading() {
  return (
    <PageShell>
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-5 w-24 rounded-md bg-white/10" />
          <div className="mt-3 h-11 w-72 rounded-lg bg-white/[0.14]" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-white/[0.07]" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card specular h-[104px]" />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <div className="card specular h-14" />
          <div className="card specular h-64" />
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading page
      </span>
    </PageShell>
  );
}
