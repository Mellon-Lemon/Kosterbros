import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The game has no server-side dependencies. A static export lets Netlify
  // serve it directly from its CDN without a framework-specific runtime.
  output: 'export',
};

export default nextConfig;
