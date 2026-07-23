/** @type {import('next').NextConfig} */
import withPWA from "next-pwa"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig = {
  output: "standalone",
  experimental: {
    instrumentationHook: true,
  },
  images: {
    domains: ["zuiceudkenboukonzdsu.supabase.co"],
  },

  async headers() {
    return [
      // 1. Strict Security Headers for ALL routes
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: zuiceudkenboukonzdsu.supabase.co https://*; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io; frame-ancestors 'none';"
          }
        ]
      },
      // 2. CORS Headers for SDK routes
      {
        source: "/api/sdk/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
        ]
      }
    ]
  }
}

const enablePwa = process.env.ENABLE_PWA === "true"

const exportedConfig = enablePwa
  ? withPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === "development",
    })(nextConfig)
  : nextConfig

export default withSentryConfig(exportedConfig, {
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
})
