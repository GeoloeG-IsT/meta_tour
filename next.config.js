/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHost
try {
  supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : undefined
} catch {}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      supabaseHost
        ? { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }
        : { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
}

module.exports = nextConfig