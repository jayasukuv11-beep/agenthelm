import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy-policy", "/terms-of-service", "/refund-policy"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/(dashboard)/",
          "/(auth)/",
          "/onboarding",
        ],
      },
    ],
    sitemap: "https://agenthelm.online/sitemap.xml",
    host: "https://agenthelm.online",
  };
}
