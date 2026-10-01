import { SUPPORTED_LOCALES, TRANSLATIONS } from '@/lib/i18n';
import { AUTH_TRANSLATIONS } from '@/lib/i18n/auth';

/**
 * `t()` falls back to English when a key is missing, which is the right
 * behaviour at runtime and the wrong behaviour to leave untested: a locale with
 * three quarters of its copy missing renders as English with no visible defect.
 * These assertions are what make an incomplete translation a build failure
 * instead of something a user discovers.
 */
describe('translation table', () => {
  const english = TRANSLATIONS.en;

  it('has a non-empty English string for every key', () => {
    const empty = Object.entries(english)
      .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it.each(SUPPORTED_LOCALES.filter((locale) => locale !== 'en'))(
    'locale %s defines every English key',
    (locale) => {
      const missing = Object.keys(english).filter((key) => !TRANSLATIONS[locale]?.[key]);
      expect(missing).toEqual([]);
    },
  );

  it.each(SUPPORTED_LOCALES)('locale %s has no blank values', (locale) => {
    const blank = Object.entries(TRANSLATIONS[locale])
      .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
      .map(([key]) => key);
    expect(blank).toEqual([]);
  });

  it('does not leave an English string behind a non-English locale', () => {
    // Identical strings are only suspicious when Amharic, Oromo or Tigrinya
    // would be expected to differ. Product names and abbreviations such as
    // "SMS" or "AgroNexus AI" are legitimately identical everywhere.
    const identical = Object.keys(AUTH_TRANSLATIONS.en).filter(
      (key) =>
        key !== 'authOtpChannelEmail' &&
        AUTH_TRANSLATIONS.am[key] === AUTH_TRANSLATIONS.en[key],
    );
    expect(identical).toEqual([]);
  });

  it('keeps the same interpolation placeholders in every locale', () => {
    const placeholdersIn = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();
    const broken: string[] = [];
    for (const key of Object.keys(AUTH_TRANSLATIONS.en)) {
      const expected = placeholdersIn(AUTH_TRANSLATIONS.en[key]);
      for (const locale of SUPPORTED_LOCALES) {
        if (locale === 'en') continue;
        const actual = placeholdersIn(AUTH_TRANSLATIONS[locale][key] ?? '');
        if (expected.join(',') !== actual.join(',')) broken.push(`${locale}:${key}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
