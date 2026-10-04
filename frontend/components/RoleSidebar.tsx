'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLocale } from './LocaleProvider';
import { roleLinkGroups, linkText, type Role } from '@/lib/navigation';

/**
 * The task switcher for a signed-in role.
 *
 * This is separate from the header on purpose. The header answers "who am I and
 * what are my global actions"; the sidebar answers "what can I do in this role".
 * Merging them is what produced the two-stacked-navigation-bars problem earlier.
 *
 * Links come from `roleLinkGroups` in lib/navigation.ts. There is deliberately no
 * second list here: two lists drift, and the dashboard would end up offering a
 * page the sidebar cannot reach.
 */

/**
 * Colour per role, written as complete literal class strings.
 *
 * These cannot be interpolated (`text-role-${role}-700`). Tailwind scans source
 * text for whole class names, so a computed name is never generated and the
 * element silently renders unstyled. A lookup keyed by role keeps every string
 * literal in the file while still selecting by role at runtime.
 */
const SIDEBAR_SURFACE: Record<Role, string> = {
  farmer: 'bg-green-900',
  processor: 'bg-blue-900',
  consumer: 'bg-purple-900',
};

const SIDEBAR_ACTIVE: Record<Role, string> = {
  farmer: 'bg-green-600 text-white',
  processor: 'bg-blue-600 text-white',
  consumer: 'bg-purple-600 text-white',
};

const SIDEBAR_HOVER: Record<Role, string> = {
  farmer: 'hover:bg-green-800',
  processor: 'hover:bg-blue-800',
  consumer: 'hover:bg-purple-800',
};

interface RoleSidebarProps {
  role: Role;
  /** Close the mobile drawer after a link is followed. No-op on desktop. */
  onNavigate?: () => void;
}

/**
 * Picks the one link that should read as current.
 *
 * Longest match wins. A plain prefix test lights up every ancestor at once: on
 * `/marketplace/orders` both "Browse catalogue" (`/marketplace`) and "My orders"
 * (`/marketplace/orders`) would be marked current, which reads as two selected
 * items in a single-select list. Matching on exactness first and then on
 * specificity keeps exactly one link highlighted at any depth.
 *
 * Segment-aware so `/marketplace` does not claim `/marketplace-admin`.
 */
function resolveActiveHref(pathname: string, links: readonly { href: string }[]): string | null {
  let best: string | null = null;

  for (const link of links) {
    const { href } = link;
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (!matches) continue;
    if (best === null || href.length > best.length) best = href;
  }

  return best;
}

export function RoleSidebar({ role, onNavigate }: RoleSidebarProps) {
  const pathname = usePathname() ?? '';
  const { t } = useLocale();
  const links = roleLinkGroups[role];
  const activeHref = resolveActiveHref(pathname, links);

  return (
    <nav
      aria-label={t('sidebarNavigation')}
      className={`${SIDEBAR_SURFACE[role]} flex flex-col gap-1 p-3`}
    >
      {links.map((link) => {
        const isActive = link.href === activeHref;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'rounded px-3 py-2 text-sm transition',
              SIDEBAR_HOVER[role],
              isActive ? SIDEBAR_ACTIVE[role] : 'text-white/80',
            ].join(' ')}
          >
            {linkText(link, t)}
          </Link>
        );
      })}
    </nav>
  );
}