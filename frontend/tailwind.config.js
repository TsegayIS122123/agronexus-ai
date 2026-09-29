
/** @type {import('tailwindcss').Config} */
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

