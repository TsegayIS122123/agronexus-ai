'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useLocale } from './LocaleProvider';
import { LanguageToggle } from './LanguageToggle';
import { NavNavigation } from './NavNavigation';

export function Header() {
  const { user, role, logout, loading } = useAuth();
  const { t, ready } = useLocale();

  if (!ready) {
    return (
      <header className="bg-gray-900 shadow-lg sticky top-0 z-50" aria-hidden="true">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-green-400 animate-pulse">{t('loading')}</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
            aria-label={t('appName')}
          >
            <span className="text-2xl" aria-hidden="true">
              🌾
            </span>
            <span className="text-xl font-bold text-green-400">
              {t('appName')}
            </span>
          </Link>

          <NavNavigation role={role} />

          <div className="hidden md:flex items-center space-x-4">
            <LanguageToggle />

            {loading ? null : user ? (
              <>
                <span className="text-white text-sm">
                  {t('welcome', { name: user.name })}
                </span>
                <Link
                  href={`/${role}/dashboard`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  {t('dashboard')}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  {t('signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
