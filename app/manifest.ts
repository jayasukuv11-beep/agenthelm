import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgentHelm — AI Agent Governance",
    short_name: "AgentHelm",
    description:
      "Enterprise-grade mission control for AI agents. Safety boundaries, live traces, Telegram control. Fail-closed by default.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ff5722",
    categories: ["developer", "productivity", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
