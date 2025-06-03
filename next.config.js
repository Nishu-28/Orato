/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add a rule to handle PDF.js worker
    config.resolve.alias.canvas = false;
    
    return config;
  },
}

module.exports = nextConfig 