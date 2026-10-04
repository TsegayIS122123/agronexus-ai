'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSession, endSession } from '@/features/auth/session';
import { useLocale } from './LocaleProvider';
import { LanguageToggle } from './LanguageToggle';
import { RoleSidebar } from './RoleSidebar';
import type { Role } from '@/lib/navigation';

/**
 * The signed-in shell: role-accented header, task sidebar, content area.
 *
 * Every role page renders through this so there is exactly one header in the
 * product. Before it existed each page grew its own dark bar and the root layout
 * also rendered the global one, which put two navigation bars on one screen with
 * two logout controls. The global header stays suppressed on these routes via
 * `SiteChrome`.
 *
 * Children are wrapped in a `div`, not a `main`: `SiteChrome` already owns the
 * single `<main id="main-content">` that the skip link targets, and nesting a
 * second landmark breaks that target.
 */

const ROLE_BAR: Record<Role, string> = {
  farmer: 'bg-green-900',
  processor: 'bg-blue-900',
  consumer: 'bg-purple-900',
};

const ROLE_BADGE: Record<Role, string> = {
  farmer: 'bg-green-700 text-green-100',
  processor: 'bg-blue-700 text-blue-100',
  consumer: 'bg-purple-700 text-purple-100',
};

/** Full literal strings, for the same Tailwind reason as in RoleSidebar. */
const ROLE_ACCENT_TEXT: Record<Role, string> = {
  farmer: 'text-green-400',
  processor: 'text-blue-400',
  consumer: 'text-purple-400',
};

const ROLE_TITLE: Record<Role, string> = {
  farmer: 'AgroNexus AI',
  processor: 'AgroNexus Industry',
  consumer: 'AgroNexus Market',
};

const ROLE_ICON: Record<Role, string> = {
  farmer: '🌾',
  processor: '🏭',
  consumer: '🛒',
};

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const router = useRouter();
  const { user } = useSession();
  const { t } = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    // endSession() clears the cookie and revokes the token server-side, so a
    // reload cannot resurrect the session. Clearing router state alone did.
    await endSession();
    router.push('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`${ROLE_BAR[role]} shadow-lg sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-expanded={sidebarOpen}
                aria-controls="role-sidebar"
                aria-label={t('toggleNavigation')}
                className="md:hidden text-white text-2xl leading-none hover:opacity-80 transition"
              >
                ☰
              </button>
              <span className="text-2xl" aria-hidden="true">
                {ROLE_ICON[role]}
              </span>
              <h1
                className={`text-xl font-bold ${ROLE_ACCENT_TEXT[role]} truncate`}
              >
                {ROLE_TITLE[role]}
              </h1>
              <span
                className={`ml-1 hidden sm:inline text-xs px-2 py-1 rounded ${ROLE_BADGE[role]}`}
              >
                {t(`role${role[0].toUpperCase()}${role.slice(1)}`)}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <span className="text-white text-sm hidden lg:block">
                  {t('welcome', { name: user.name })}
                </span>
              ) : null}
              <Link
                href={`/${role}/profile`}
                className="text-white/90 hover:text-white transition text-sm font-medium"
              >
                {t('profile')}
              </Link>
              <LanguageToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-6 items-start">
          {/* Static column on desktop; slide-over on mobile. */}
          <div className="hidden md:block shrink-0 rounded-lg overflow-hidden sticky top-24">
            <RoleSidebar role={role} />
          </div>

          {sidebarOpen ? (
            <div className="md:hidden fixed inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={closeSidebar}
                aria-hidden="true"
              />
              <div
                id="role-sidebar"
                className="relative rounded-r-lg overflow-hidden"
              >
                <RoleSidebar role={role} onNavigate={closeSidebar} />
              </div>
            </div>
          ) : null}

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}