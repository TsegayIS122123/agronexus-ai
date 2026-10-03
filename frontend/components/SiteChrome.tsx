'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Header as GlobalHeader } from './Header';
import { Footer as GlobalFooter } from './Footer';

/**
 * Decides whether the global header belongs on this page, and keeps the footer.
 *
 * The signed-in dashboards ship their own header: a dark, role-coloured bar with
 * the person's name and a logout button. Rendering the global header above it as
 * well produced two navigation bars stacked on top of each other, so the same
 * product name, the same "welcome back" line and two different logout controls
 * appeared on the same screen.
 *
 * The deeper signed-in pages (/farmer/disease, /processor/quality and the rest)
 * keep the global header for now. They have no header of their own yet, and each
 * will grow its own navigation and sidebar in a later phase. Until then, hiding
 * the global one would leave them with nothing at all.
 *
 * The distinction is structural rather than a matter of taste. Dashboard pages
 * are inside the root layout too, so without this gate every one of them gets
 * both headers. Each dashboard will grow its own navigation and sidebar in a
 * later phase, and this keeps that work from having to fight the global one.
 *
 * Membership is decided by path prefix because this has to run in the root
 * layout, which is a server component and cannot read the router. The prefix is
 * matched segment by segment so `/marketplace` is public while
 * `/marketplace/orders` stays protected in its own right.
 */
const PUBLIC_SEGMENTS = new Set([
  'about',
  'contact',
  'solutions',
  'auth',
  'marketplace',
  'farmer',
  'processor',
  'consumer',
]);

function isDashboardPath(pathname: string): boolean {
  const [, first, second] = pathname.split('/');

  // A bare `/farmer` has no dashboard behind it, so nothing to suppress.
  if (!PUBLIC_SEGMENTS.has(first)) return false;

  return second === 'dashboard';
}

/**
 * Wraps the site chrome and omits the global header on dashboard routes.
 *
 * The footer is deliberately kept everywhere. It is the one consistent element on
 * the site: the same quick links, contact details and copyright on every page,
 * including a signed-in dashboard. Removing it there left dashboards as the only
 * pages without one, which reads as unfinished rather than intentional.
 *
 * The header is different. Each dashboard renders its own dark role-coloured bar
 * with the person's name and a logout button, so showing the global header above
 * it produced two stacked navigation bars.
 *
 * `main` lives here so the skip link target keeps working on every page,
 * whichever chrome is present.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const hideHeader = isDashboardPath(pathname);

  return (
    <>
      {hideHeader ? null : <GlobalHeader />}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <GlobalFooter />
    </>
  );
}