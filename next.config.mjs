/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  // This creates a minimal production build with only necessary files
  // Reduces Docker image size by ~60%
  output: 'standalone',

  // Enable ESLint during builds
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Enable TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // Allow images from Backblaze B2
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ceritakita-images.s3.eu-central-003.backblazeb2.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Exclude better-sqlite3 from client-side bundle
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },

  // Webpack config to handle native modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
