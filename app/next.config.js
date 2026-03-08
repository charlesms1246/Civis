/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize images — allow Blockscout, Wikimedia, GitHub, and all HTTPS hosts
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'creditcoin-testnet.blockscout.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'ethglobal.b-cdn.net' },
      { protocol: 'https', hostname: 'ethglobal.com' },
      // Broad fallback for other external images (e.g. org logos)
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Ensure viem runs correctly in server-side API routes
  serverExternalPackages: ['viem'],

  // RainbowKit ships ESM — transpile to avoid bundling issues
  transpilePackages: ['@rainbow-me/rainbowkit'],

  // Suppress pino-pretty false-positive warning from wagmi/viem transitive dependency.
  // pino-pretty is an optional dev formatter; we don't use it at runtime.
  webpack: (config) => {
    config.externals.push('pino-pretty')
    return config
  },
}

module.exports = nextConfig