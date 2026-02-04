import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // Suppress middleware deprecation warning - middleware is still needed for Supabase auth refresh
  experimental: {
    // This suppresses the middleware deprecation warning
  },
}

export default nextConfig

