/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false }
};

export default nextConfig;
