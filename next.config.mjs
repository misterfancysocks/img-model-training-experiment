/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [...(config.externals || []), {
        sharp: 'commonjs sharp',
      }];
    }
    return config;
  },
  images: {
    domains: ['storage.googleapis.com'],
  },
};

export default nextConfig;
