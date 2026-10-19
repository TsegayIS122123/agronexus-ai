/** @type {import('next').NextConfig} */
const nextConfig = {
  // axios is still imported by the six AI pages (disease, prices, chat,
  // quality, equipment, feasibility) until they are migrated to the shared
  // api-client. transpilePackages keeps Next's compiler happy with it in the
  // meantime; removing this line breaks the build for those pages.
  transpilePackages: ['axios'],
};

module.exports = nextConfig;
