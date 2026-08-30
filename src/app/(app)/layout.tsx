import { redirect } from "next/navigation";
import { TopNav } from "@/components/shell/TopNav";
import { getSession } from "@/lib/auth/session";

/**
 * Shell for every signed-in page.
 *
 * The navigation lives here rather than inside each page for a concrete
 * reason: a layout is not re-rendered when you move between its children, so
 * the rail and its active-pill stay mounted across navigation. Previously each
 * page returned its own <TopNav>, which meant the router had to wait for the
 * whole page — chrome included — before it could paint anything, and the
 * screen simply froze until the server replied.
 *
 * Pairing this with loading.tsx gives the navigation an instant response: the
 * shell stays put, and only the content region swaps to a skeleton.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <TopNav session={session} />
      {children}
    </>
  );
}
