/** @type {import('next').NextConfig} */

// The FastAPI service is reached through a server-side rewrite, never directly
// from the browser. Set AI_SERVICE_URL when the API is not on the host machine
// (for example the `ai-service` hostname when running under Docker Compose).
const aiServiceUrl =
  process.env.AI_SERVICE_URL || 'http://localhost:8000';

const nextConfig = {
  transpilePackages: ['axios'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${aiServiceUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
