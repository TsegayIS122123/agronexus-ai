'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useLocale } from './LocaleProvider';
import { LinkButton } from './Button';

interface PageLoadingProps {
  targetPath?: string;
}

export function PageLoading({ targetPath }: PageLoadingProps) {
  const { logout, role } = useAuth();
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse" aria-hidden="true">
          🌾
        </div>
        <p className="text-gray-600">{t('loading')}</p>
        {targetPath && (
          <div className="mt-4">
            <LinkButton href={targetPath} variant="secondary" size="sm">
              {t('backToDashboard')}
            </LinkButton>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="mt-4 text-sm text-red-600 hover:text-red-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

export function usePageLoading(role?: string | null) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !user) {
    }
  }, [authLoading, user]);

  if (authLoading) {
    return { show: true, targetPath: '/' };
  }

  if (!user) {
    return { show: true, targetPath: '/' };
  }

  return { show: false, targetPath: `/${role}/dashboard` };
}
