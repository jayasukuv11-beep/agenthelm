import type { Metadata } from "next";
import GuidePageClient from "./page-client";

export const metadata: Metadata = {
  title: "AI Agent Governance Guide | Security & Safety SDK",
  description: "Learn how to secure your AI agents using AgentHelm. This guide covers fail-closed tool decorators, state integrity hashing, and human-in-the-loop safety boundaries.",
  keywords: ["AI agent security guide", "agent governance tutorial", "SDK safety boundaries", "agent checkpointing tutorial"],
};

export default function GuidePage() {
  return (
    <>
      <GuidePageClient />
    </>
  );
}
