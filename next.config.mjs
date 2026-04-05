/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain (for article thumbnails)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
