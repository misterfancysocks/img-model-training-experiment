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
};

export default nextConfig;
