/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/ideago/**",
      },
    ],
  },
};

module.exports = nextConfig;
