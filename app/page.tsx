import type { Metadata } from "next";
import LandingPageClient from "./page-client";

// ── Page-level metadata (overrides layout defaults) ────────────────────────
export const metadata: Metadata = {
  title: "AgentHelm | The Project Brain for AI Engineering",
  description:
    "AgentHelm gives every AI coding agent a shared Project Brain so they remember architecture, APIs, decisions, and project knowledge instead of starting from scratch. One Project. One Brain. Unlimited AI Agents.",
  alternates: {
    canonical: "https://agenthelm.online",
  },
  openGraph: {
    title: "AgentHelm | The Project Brain for AI Engineering",
    description:
      "One Project. One Brain. Unlimited AI Agents. AgentHelm gives every AI coding agent a shared Project Brain so they remember architecture, APIs, decisions, and project knowledge instead of starting from scratch.",
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
        alt: "AgentHelm — The Project Brain for AI Engineering",
      },
    ],
  },
};

// ── JSON-LD: VideoObject schema for the demo video ─────────────────────────
const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "AgentHelm — The Project Brain for AI Engineering Demo",
  description:
    "See AgentHelm in action: project brain pipeline, context injection, knowledge proposals, security pipeline, and observability for production AI engineering.",
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