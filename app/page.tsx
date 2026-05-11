import type { Metadata } from "next";
import LandingPageClient from "./page-client";

// ── Page-level metadata (overrides layout defaults) ────────────────────────
export const metadata: Metadata = {
  title: "AgentHelm | Mission Control for AI Agents",
  description:
    "Enterprise-grade SDK and dashboard for governing AI agents in production. Safety boundaries, live traces, Telegram control. Fail-closed by default. Free to start.",
  alternates: {
    canonical: "https://agenthelm.online",
  },
  openGraph: {
    title: "AgentHelm | Mission Control for AI Agents",
    description:
      "Stop agent loops, prevent budget hemorrhage, and take remote control via Telegram. The governance SDK that wraps around any AI framework.",
    url: "https://agenthelm.online",
    type: "website",
    videos: [
      {
        url: "https://agenthelm.online/agenthelm-demo.mp4",
        type: "video/mp4",
        width: 1920,
        height: 1080,
      },
    ],
    images: [
      {
        url: "/agenthelm_cover_1777099941437.png",
        width: 1200,
        height: 630,
        alt: "AgentHelm — Mission Control for Autonomous Agents",
      },
    ],
  },
};

// ── JSON-LD: VideoObject schema for the demo video ─────────────────────────
const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "AgentHelm — AI Agent Mission Control Demo",
  description:
    "See AgentHelm in action: real-time agent traces, safety boundaries, Telegram remote control, and fail-closed mode for production AI agents.",
  thumbnailUrl: "https://agenthelm.online/agenthelm_cover_1777099941437.png",
  uploadDate: "2026-05-11",
  contentUrl: "https://agenthelm.online/agenthelm-demo.mp4",
  embedUrl: "https://agenthelm.online/agenthelm-demo.mp4",
  publisher: {
    "@type": "Organization",
    name: "AgentHelm",
    logo: {
      "@type": "ImageObject",
      url: "https://agenthelm.online/agenthelm_cover_1777099941437.png",
    },
  },
  keywords:
    "AI agent governance, agent observability, human-in-the-loop AI, fail-closed AI, Telegram agent control",
};

export default function LandingPage() {
  return (
    <>
      {/* VideoObject schema for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      {/* All interactive/animated client UI */}
      <LandingPageClient />
    </>
  );
}
