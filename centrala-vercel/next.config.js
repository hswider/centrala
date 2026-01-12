/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.allegroimg.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
    ],
  },
};

module.exports = nextConfig;
