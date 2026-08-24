import type { Metadata } from "next";
import LandingPageClient from "./page-client";

// ── Page-level metadata (overrides layout defaults) ────────────────────────
export const metadata: Metadata = {
  title: "AgentHelm | The Control Plane for AI Agents",
  description:
    "AgentHelm keeps autonomous AI agents safe in production: human-in-the-loop approvals, audit trails, budget guardrails, and a shared Project Brain — wrapped around any agent framework.",
  alternates: {
    canonical: "https://agenthelm.online",
  },
  openGraph: {
    title: "AgentHelm | The Control Plane for AI Agents",
    description:
      "Fail-closed governance for autonomous agents. HITL approvals, audit trail, budget guardrails, and a shared Project Brain — wrapped around any framework.",
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
        alt: "AgentHelm — The Control Plane for AI Agents",
      },
    ],
  },
};

// ── JSON-LD: VideoObject schema for the demo video ─────────────────────────
const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "AgentHelm — The Control Plane for AI Agents Demo",
  description:
    "See AgentHelm in action: governance controls, Project Brain pipeline, context injection, knowledge proposals, security pipeline, and observability for production AI agents.",
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
    "AI engineering, project brain, context injection, knowledge proposals, brain pipeline, agent observability, AI infrastructure",
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