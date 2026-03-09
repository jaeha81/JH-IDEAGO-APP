/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow images from local MinIO in development
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
