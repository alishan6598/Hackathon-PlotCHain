/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: ".",
  },
  // Allow IPFS gateway images (Pinata subdomain resolved from env at runtime)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mypinata.cloud" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
  },
};

export default nextConfig;
