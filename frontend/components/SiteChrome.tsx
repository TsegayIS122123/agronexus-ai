'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Header as GlobalHeader } from './Header';
import { Footer as GlobalFooter } from './Footer';

/**
 * Decides whether the global header belongs on this page, and keeps the footer.
 *
 * Every signed-in page now renders its own header. The three dashboards and the
 * six deeper role pages all use DashboardShell, which draws a dark, role-coloured
 * bar with the person's name and a logout button. Rendering the global header
 * above it produced two navigation bars stacked on top of each other, so the same
 * product name, the same "welcome back" line and two different logout controls
 * appeared on the same screen.
 *
 * The deeper pages used to keep the global header because they had no header of
 * their own. That is no longer true, so the exemption they relied on has been
 * removed along with the headers it justified.
 *
 * Membership is decided by path prefix because this has to run in the root
 * layout, which is a server component and cannot read the router.
 */

/**
 * First path segments that are behind the sign-in gate and render DashboardShell.
 *
 * Deliberately narrower than the product's top-level sections. Adding `about` or
 * `marketplace` here would strip the global header from pages that legitimately
 * need it, which is the opposite of what this gate is for.
 */
const ROLE_SEGMENTS = new Set(['farmer', 'processor', 'consumer']);

function isDashboardPath(pathname: string): boolean {
  const [, first] = pathname.split('/');

  // Every route under a role prefix is behind the sign-in gate and now renders
  // DashboardShell, so the global header is suppressed for all of them. Matching
  // on the prefix rather than an exact segment keeps this from needing to be
  // updated each time a role page is added.
  return ROLE_SEGMENTS.has(first);
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