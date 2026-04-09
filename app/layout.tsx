import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#ff5722", // Industrial Signal Orange
};

export const metadata: Metadata = {
  title: "AgentHelm | The Industrial Standard for AI Agent Governance",
  description: "Enterprise-grade mission control for AI agents. Implement safety boundaries, monitor execution, and prevent token loops with mission-critical precision.",
  keywords: ["AI agent governance", "agent observability", "human-in-the-loop AI", "agent safety SDK", "AI budget protection"],
  authors: [{ name: "AgentHelm Research Team", url: "https://agenthelm.online" }],
  openGraph: {
    title: "AgentHelm | AI Agent Mission Control",
    description: "Professional-grade observability and control for autonomous agents. Fail-closed security and real-time intervention.",
    type: "website",
    url: "https://agenthelm.online",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AgentHelm Mission Control" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentHelm | AI Agent Governance",
    description: "Stop agent loops and secure your API budget with one line of code.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://agenthelm.online",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AgentHelm",
  "operatingSystem": "Independent",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Organization",
    "name": "AgentHelm"
  },
  "description": "The mission control SDK for AI agents."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-[#ff5722] selection:text-white`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
