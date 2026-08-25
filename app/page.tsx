import type { Metadata } from "next";
import LandingPageClient from "./page-client";

// ── Page-level metadata (overrides layout defaults) ────────────────────────
export const metadata: Metadata = {
  title: "AgentHelm | The Control Plane for AI Agents",
  description:
    "AgentHelm keeps autonomous AI agents safe in production: human-in-the-loop approvals, audit trails, budget guardrails, and a shared Project Brain — wrapped around any agent framework. India-first, powered by Sarvam AI.",
  keywords: [
    "AI agent control plane",
    "human in the loop AI",
    "LLM agent governance",
    "AI agent observability",
    "agent budget guardrails",
    "autonomous agent safety",
    "AI agent audit trail",
    "Sarvam AI",
    "India AI startup",
    "production AI agents",
  ],
  alternates: {
    canonical: "https://agenthelm.online",
  },
  openGraph: {
    title: "AgentHelm | The Control Plane for AI Agents",
    description:
      "Fail-closed governance for autonomous agents. HITL approvals, audit trail, budget guardrails, and a shared Project Brain — wrapped around any framework. Powered by Sarvam AI.",
    url: "https://agenthelm.online",
    type: "website",
    siteName: "AgentHelm",
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
  twitter: {
    card: "summary_large_image",
    title: "AgentHelm | The Control Plane for AI Agents",
    description:
      "Fail-closed governance for autonomous agents. Powered by Sarvam AI.",
    images: ["/agenthelm_cover_1777099941437.png"],
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

// ── JSON-LD: SoftwareApplication for rich results ─────────────────────────
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgentHelm",
  operatingSystem: "Web",
  applicationCategory: "DeveloperApplication",
  description:
    "The control plane for autonomous AI agents — human-in-the-loop approvals, audit trails, budget guardrails, and a shared Project Brain. India-first, powered by Sarvam AI.",
  url: "https://agenthelm.online",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Free tier — 1 agent & 1 project, no credit card required",
  },
  publisher: {
    "@type": "Organization",
    name: "AgentHelm",
  },
};

// ── JSON-LD: FAQPage for long-tail search capture ─────────────────────────
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is an AI agent control plane?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A control plane sits between your autonomous AI agents and the tools they call. AgentHelm adds human-in-the-loop approvals, audit trails, budget guardrails, and a shared memory layer (Project Brain) so agents stay accountable and recoverable in production.",
      },
    },
    {
      "@type": "Question",
      name: "How do I add human-in-the-loop approvals to my LLM agent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Point your agent's SDK calls through AgentHelm. High-risk actions (sending email, posting, payments) are held for approval via Telegram. Approve or reject from your phone — the agent waits fail-closed until you decide.",
      },
    },
    {
      "@type": "Question",
      name: "Does AgentHelm work with any agent framework?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. AgentHelm wraps around any framework (LangChain, AutoGen, CrewAI, custom loops) through a lightweight SDK and MCP server. You keep your existing agent code — AgentHelm governs the boundaries.",
      },
    },
    {
      "@type": "Question",
      name: "How are AI agent costs controlled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgentHelm enforces per-agent and per-project budget guardrails, tracks token and tool-call spend in real time, and alerts or halts agents that exceed limits. Billing is India-first in INR via Cashfree.",
      },
    },
    {
      "@type": "Question",
      name: "Is AgentHelm secure and multi-tenant isolated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. AgentHelm is fail-closed by default, scopes credentials per agent, enforces tenant isolation at the database row level, and keeps a complete, tamper-evident audit trail of every decision an agent makes.",
      },
    },
    {
      "@type": "Question",
      name: "Which LLM does AgentHelm use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgentHelm is powered by Sarvam AI's models for its governance intelligence (explanations, intent parsing, evaluations). Your own agents can run on any model — AgentHelm governs them regardless of provider.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      {/* Structured data for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* All interactive/animated client UI */}
      <LandingPageClient />
    </>
  );
}
