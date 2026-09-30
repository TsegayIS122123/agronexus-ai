/**
 * Tailwind loads this file through jiti (Tailwind 3.4), so the TypeScript
 * token source is transpiled rather than parsed as CommonJS. `lib/theme.ts` is
 * the single source of truth for design tokens: components import it through
 * the `@/lib/theme` alias and Tailwind reads the same object here, so the two
 * cannot drift apart the way a duplicated `theme.js` did.
 *
 * @type {import('tailwindcss').Config}
 */
const { TAILWIND_EXTENSION } = require('./lib/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: TAILWIND_EXTENSION,
  },
  plugins: [],
};

