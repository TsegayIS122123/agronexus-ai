'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { useLocale } from './LocaleProvider';
import { roleLinkGroups, type NavigationLink } from '@/lib/navigation';
import { useLocaleValue } from './LocaleProvider';

interface NavNavigationProps {
  role: 'farmer' | 'processor' | 'consumer' | null;
}

export function NavNavigation({ role }: NavNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { t, locale } = useLocale();
  const { setLocale } = useLocaleValue();

  const links: NavigationLink[] = role ? roleLinkGroups[role] : [];

  const handleOpen = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setMobileOpen(true);
    const first = mobileMenuRef.current?.querySelector<HTMLElement>(
      'a, button'
    );
    first?.focus();
  }, []);

  const handleClose = useCallback(() => {
    setMobileOpen(false);
    previousFocusRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeHref = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="hidden md:flex items-center space-x-6"
      >
        <Link
          href="/"
          className="text-white hover:text-gray-300 transition font-medium"
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          {t('home')}
        </Link>
        <div className="relative group">
          <button
            type="button"
            className="text-white hover:text-gray-300 transition font-medium flex items-center gap-1"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {t('solutions')}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className="absolute left-0 pt-2 w-56 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block"
            role="menu"
          >
            <Link
              href="/solutions/farmers"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
              role="menuitem"
            >
              {t('solutionsForFarmers')}
            </Link>
            <Link
              href="/solutions/processors"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
              role="menuitem"
            >
              {t('solutionsForProcessors')}
            </Link>
            <Link
              href="/solutions/consumers"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
              role="menuitem"
            >
              {t('solutionsForConsumers')}
            </Link>
          </div>
        </div>
        <Link
          href="/marketplace"
          className="text-white hover:text-gray-300 transition font-medium"
          aria-current={pathname.startsWith('/marketplace') ? 'page' : undefined}
        >
          {t('marketplace')}
        </Link>
        <Link
          href="/contact"
          className="text-white hover:text-gray-300 transition font-medium"
          aria-current={pathname === '/contact' ? 'page' : undefined}
        >
          {t('contact')}
        </Link>
      </nav>

      <div className="flex md:hidden items-center gap-2">
        <select
          value={locale}
          onChange={(e) => {
            const next = eventTargetValueAsLocale(e.target.value);
            if (next) {
              setLocale(next);
            }
          }}
          className="text-sm rounded-lg px-2 py-1 bg-gray-700 text-white border border-gray-600"
          aria-label="Language"
        >
          {(['en', 'am', 'om', 'ti'] as const).map((loc) => (
            <option key={loc} value={loc}>
              {loc.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="text-white hover:text-gray-300 transition text-sm font-medium"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={handleOpen}
        >
          {t('signIn')}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={handleClose}
          onKeyDown={handleKeyDown}
        >
          <nav
            className="relative bg-gray-900 text-white h-full flex flex-col p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Menu</span>
              <button
                type="button"
                className="text-white hover:text-gray-300 transition text-2xl"
                aria-label="Close menu"
                onClick={handleClose}
              >
                ×
              </button>
            </div>
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="block px-3 py-2 rounded hover:bg-gray-800"
                onClick={handleClose}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                {t('home')}
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 rounded hover:bg-gray-800"
                onClick={handleClose}
                aria-current={pathname === '/about' ? 'page' : undefined}
              >
                {t('about')}
              </Link>
              <div className="flex flex-col space-y-2 pl-3 border-l border-gray-700">
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {t('solutions')}
                </span>
                <Link
                  href="/solutions/farmers"
                  className="block px-3 py-2 rounded hover:bg-gray-800"
                  onClick={handleClose}
                >
                  {t('solutionsForFarmers')}
                </Link>
                <Link
                  href="/solutions/processors"
                  className="block px-3 py-2 rounded hover:bg-gray-800"
                  onClick={handleClose}
                >
                  {t('solutionsForProcessors')}
                </Link>
                <Link
                  href="/solutions/consumers"
                  className="block px-3 py-2 rounded hover:bg-gray-800"
                  onClick={handleClose}
                >
                  {t('solutionsForConsumers')}
                </Link>
              </div>
              <Link
                href="/marketplace"
                className="block px-3 py-2 rounded hover:bg-gray-800"
                onClick={handleClose}
                aria-current={pathname.startsWith('/marketplace') ? 'page' : undefined}
              >
                {t('marketplace')}
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 rounded hover:bg-gray-800"
                onClick={handleClose}
                aria-current={pathname === '/contact' ? 'page' : undefined}
              >
                {t('contact')}
              </Link>
            </div>
            {role && (
              <div className="mt-auto pt-4 border-t border-gray-700">
                <Link
                  href={`/${role}/dashboard`}
                  className="block w-full text-center bg-green-600 hover:bg-green-700 transition py-2 rounded text-sm font-medium"
                  onClick={handleClose}
                >
                  {t('dashboard')}
                </Link>
                <button
                  type="button"
                  className="mt-2 w-full text-left text-gray-300 hover:text-white transition text-sm py-1"
                  onClick={handleClose}
                >
                  {t('signIn')}
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

function eventTargetValueAsLocale(value: string): 'en' | 'am' | 'om' | 'ti' | null {
  if (value === 'en' || value === 'am' || value === 'om' || value === 'ti') {
    return value;
  }
  return null;
}
