import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

  it('does not leave an English string behind the Amharic locale', () => {
    // A copy-pasted English string is the failure this catches: Amharic is a
    // supported locale, so an untranslated value is a gap rather than a
    // deliberate fallback. Product names and abbreviations such as "SMS" or
    // "AgroNexus AI" are legitimately identical, which authOtpChannelEmail is.
    const identical = Object.keys(AUTH_TRANSLATIONS.en).filter(
      (key) =>
        key !== 'authOtpChannelEmail' &&
        AUTH_TRANSLATIONS.am[key] === AUTH_TRANSLATIONS.en[key],
    );
    expect(identical).toEqual([]);
  });

  it('offers only the two languages the product maintains', () => {
    // Guards against a locale being added to SUPPORTED_LOCALES without a
    // translation table, which would render as silent English fallback.
    expect(SUPPORTED_LOCALES).toEqual(['en', 'am']);
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

  /**
   * The reverse direction.
   *
   * Every assertion above asks "does the locale have the key English has?". This
   * asks the opposite: a key that exists only in a translation is dead weight
   * at best and a rendering bug at worst. English is the reference table, so
   * anything the reference lacks has no defined English text, and a component
   * calling `t('price')` in English renders the key name itself.
   *
   * This was not hypothetical: thirteen marketplace keys (price, quantity,
   * seller, product, placeOrder, myOrders, viewDetails, contactSeller,
   * browseCatalog, searchProducts, noProductsFound, createListing,
   * loadingProducts) were Amharic-only and the one-directional test passed.
   */
  it('has no locale-only keys that English lacks', () => {
    const englishKeys = new Set(Object.keys(TRANSLATIONS.en));
    const orphaned: string[] = [];

    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      for (const key of Object.keys(TRANSLATIONS[locale])) {
        if (!englishKeys.has(key)) orphaned.push(`${locale}:${key}`);
      }
    }

    expect(orphaned).toEqual([]);
  });

  /**
   * U+FFFD REPLACEMENT CHARACTER.
   *
   * This is not a style rule. A replacement character is what a decoder emits
   * when it has already lost the original bytes, so the string is not a
   * translation with a typo in it — it is a corrupted string that renders as a
   * black diamond in the middle of a sentence. One shipped this way already:
   * the Amharic for "suppliers" was `��ስረጋዮች`, and every key-existence test
   * passed because the key was present and non-blank.
   *
   * No automated check can tell you the words are *correct* Amharic. This at
   * least fails on the class of damage that is mechanically detectable, which
   * is a different and much weaker claim.
   */
  it('contains no Unicode replacement characters', () => {
    const corrupted: string[] = [];

    for (const locale of SUPPORTED_LOCALES) {
      for (const [key, value] of Object.entries(TRANSLATIONS[locale])) {
        if (value.includes('\uFFFD')) corrupted.push(`${locale}:${key}`);
      }
    }

    expect(corrupted).toEqual([]);
  });

  /**
   * Duplicate keys in a table literal.
   *
   * A duplicate does not throw. JavaScript keeps the last value and discards the
   * first silently, so the translation you reviewed can be replaced by one you
   * never saw while every runtime assertion still passes. This reads the source
   * rather than the imported object, because the object has already lost the
   * evidence by the time a test could inspect it.
   */
  it('declares no key twice in either table', () => {
    const source = readFileSync(
      join(process.cwd(), 'lib/i18n/index.ts'),
      'utf8',
    );

    const sectionFor = (locale: string): string => {
      const start = source.indexOf(`  ${locale}: {`);
      const end =
        locale === 'en'
          ? source.indexOf('  am: {')
          : source.indexOf('const TRANSLATIONS');
      return source.slice(start, end);
    };

    for (const locale of SUPPORTED_LOCALES) {
      const keys = Array.from(sectionFor(locale).matchAll(/^ {4}(\w+):/gm)).map(
        (m) => m[1],
      );
      const seen = new Set<string>();
      const duplicates = keys.filter(
        (key) => seen.has(key) || (seen.add(key), false),
      );
      expect({ locale, duplicates }).toEqual({ locale, duplicates: [] });
    }
  });
});
