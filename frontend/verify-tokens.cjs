// Decisive proof: resolve tailwind.config.js the same way Tailwind 3.4 does
// (jiti), and print the token groups Tailwind will actually generate from.
const jiti = require('jiti')(__filename, { interopDefault: true });
const path = require('path');

const config = jiti(path.resolve(__dirname, 'tailwind.config.js'));

const ext = config.theme.extend;
console.log('tailwind.config.js resolved OK');
console.log('token groups seen by Tailwind:\n');

const expect = [
  'colors', 'fontFamily', 'fontSize', 'spacing', 'borderRadius',
  'boxShadow', 'transitionDuration', 'transitionTimingFunction', 'zIndex',
];

for (const key of expect) {
  const present = ext && Object.prototype.hasOwnProperty.call(ext, key);
  console.log(`  ${present ? 'OK  ' : 'MISS'}  ${key}`);
}

console.log('\nvalues unique to theme.ts (absent from Tailwind defaults):');
console.log('  transitionDuration.slow      =', ext.transitionDuration?.slow);
console.log('  transitionDuration.DEFAULT   =', ext.transitionDuration?.DEFAULT);
console.log('  transitionTimingFunction.easeInOut =', ext.transitionTimingFunction?.easeInOut);
console.log('  fontFamily.ethiopic          =', JSON.stringify(ext.fontFamily?.ethiopic));

const missing = expect.filter((k) => !ext || !(k in ext));
if (missing.length) {
  console.error('\nFAIL: missing token groups ->', missing.join(', '));
  process.exit(1);
}
console.log('\nPASS: all 9 token groups resolve through the TypeScript source.');
