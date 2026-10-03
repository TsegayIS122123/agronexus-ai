'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Header as GlobalHeader } from './Header';
import { Footer as GlobalFooter } from './Footer';

/**
 * Shows the marketing header and footer only where they belong.
 *
 * The signed-in dashboards ship their own header: a dark, role-coloured bar with
 * the person's name and a logout button. Rendering the global header above it as
 * well produced two navigation bars stacked on top of each other, so the same
 * product name, the same "welcome back" line and two different logout controls
 * appeared on the same screen.
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
 * Wraps the site chrome and omits it on dashboard routes.
 *
 * `main` lives here too, so the skip link target keeps working on every page
 * regardless of which chrome is present.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const hideChrome = isDashboardPath(pathname);

  return (
    <>
      {hideChrome ? null : <GlobalHeader />}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {hideChrome ? null : <GlobalFooter />}
    </>
  );
}