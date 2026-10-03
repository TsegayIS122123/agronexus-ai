import type { Metadata } from 'next';
import './globals.css';
import { SkipLink } from '@/components/SkipLink';
import { SiteChrome } from '@/components/SiteChrome';
import { AuthProvider } from '@/components/AuthProvider';
import { LocaleProvider } from '@/components/LocaleProvider';

export const metadata: Metadata = {
  title: {
    default: 'AgroNexus AI — Ethiopian Agricultural Intelligence',
    template: '%s | AgroNexus AI',
  },
  description:
    'AI-powered platform connecting Ethiopian farmers to agro-industry through disease detection, price prediction, and market access.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AgroNexus AI',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#065f46" />
      </head>
      <body>
        <AuthProvider>
          <LocaleProvider>
            <SkipLink />
            {/* Header, page, footer. The dashboards inside this layout render their
                own header, so SiteChrome omits the global one there. */}
            <SiteChrome>{children}</SiteChrome>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
