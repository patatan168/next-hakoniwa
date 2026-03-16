/** @type {import('next').NextConfig} */
import dotenvFlow from 'dotenv-flow';
dotenvFlow.config({ silent: true });
const nextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  sassOptions: {
    additionalData: Object.entries(process.env)
      .filter(([key, value]) => key.startsWith('NEXT_PUBLIC_') && value !== undefined)
      .map(([key, value]) => `$${key}: "${value}";`)
      .join('\n'),
  },
  async headers() {
    if (process.env.NODE_ENV === 'development') return [];
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'false' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Accept, Accept-Language, Content-Language, Content-Type Range',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; worker-src 'self'; manifest-src 'self';",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'false' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_ORIGIN_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,POST,PUT,PATCH' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Accept, Accept-Language, Content-Language, Content-Type Range',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; upgrade-insecure-requests;",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_ORIGIN_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,POST,PUT,PATCH' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Accept, Accept-Language, Content-Language, Content-Type Range',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; upgrade-insecure-requests;",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
  experimental: {
    // JS の minify を有効化（Terser のような詳細設定は不可）
    turbopackMinify: true,
  },
};

export default nextConfig;
