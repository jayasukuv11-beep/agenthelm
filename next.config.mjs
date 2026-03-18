/** @type {import('next').NextConfig} */
import withPWA from "next-pwa"

const nextConfig = {
  images: {
    domains: ["zuiceudkenboukonzdsu.supabase.co"],
  },

  // ✅ ADD THIS — allows external agents/browsers to call SDK routes
  async headers() {
    return [
      {
        source: "/api/sdk/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ]
  },
}

// NOTE:
// next-pwa can be flaky during build on Windows in some setups.
// Keep PWA disabled by default for now; re-enable once stable.
const enablePwa = process.env.ENABLE_PWA === "true"

export default enablePwa
  ? withPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === "development",
    })(nextConfig)
  : nextConfig
