/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg', '@electric-sql/pglite', 'bcryptjs', 'pdfkit'],
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
};
export default nextConfig;
