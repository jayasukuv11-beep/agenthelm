import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const viewport: Viewport = {
  themeColor: "#ff5722",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://agenthelm.online"),
  title: {
    default: "AgentHelm | Mission Control for AI Agents",
    template: "%s | AgentHelm",
  },
  description:
    "Enterprise-grade SDK and dashboard for governing AI agents in production. Implement safety boundaries, monitor execution in real-time, and prevent token loops with mission-critical precision. Free to start.",
  keywords: [
    "AI agent governance",
    "AI agent observability",
    "human-in-the-loop AI",
    "agent safety SDK",
    "AI budget protection",
    "fail-closed AI",
    "LLM agent monitoring",
    "agent execution traces",
    "autonomous agent control",
    "Telegram agent control",
    "agenthelm",
    "AI governance platform",
    "LangGraph alternative",
    "LangSmith alternative",
  ],
  authors: [{ name: "AgentHelm Research Team", url: "https://agenthelm.online" }],
  creator: "AgentHelm Research Team",
  publisher: "AgentHelm",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "AgentHelm | Mission Control for AI Agents",
    description:
      "Stop agent loops, prevent budget hemorrhage, and take remote control via Telegram. The governance SDK that wraps around any AI framework.",
    type: "website",
    url: "https://agenthelm.online",
    siteName: "AgentHelm",
    locale: "en_US",
    images: [
      {
        url: "/agenthelm_cover_1777099941437.png",
        width: 1200,
        height: 630,
        alt: "AgentHelm — Mission Control for Autonomous Agents",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentHelm | AI Agent Governance",
    description:
      "Stop agent loops and secure your API budget with one line of code. Fail-closed by default.",
    images: ["/agenthelm_cover_1777099941437.png"],
    creator: "@agenthelm",
    site: "@agenthelm",
  },
  alternates: {
    canonical: "https://agenthelm.online",
  },
  category: "technology",
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AgentHelm",
    "operatingSystem": "Any",
    "applicationCategory": "DeveloperApplication",
    "applicationSubCategory": "AI Agent Governance",
    "url": "https://agenthelm.online",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier — 3 agents, 100K traces/month"
    },
    "author": {
      "@type": "Organization",
      "name": "AgentHelm",
      "url": "https://agenthelm.online"
    },
    "description": "Enterprise-grade SDK and dashboard for governing AI agents in production. Provides safety boundaries, real-time observability, fault-tolerant checkpointing, and human-in-the-loop controls via Telegram.",
    "featureList": [
      "Classification-First safety boundaries",
      "Real-time execution traces",
      "Telegram remote control",
      "Fail-closed mode",
      "Budget protection guardrails",
      "SHA256 state integrity checkpointing",
      "LLM-as-a-Judge evaluation pipeline"
    ],
    "screenshot": "https://agenthelm.online/agenthelm_moat_security_1777100006182.png",
    "softwareVersion": "1.0.0",
    "releaseNotes": "https://agenthelm.online/#how-it-works"
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AgentHelm",
    "url": "https://agenthelm.online",
    "logo": "https://agenthelm.online/agenthelm_cover_1777099941437.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "tharagesharumugam@gmail.com",
      "contactType": "Customer Support"
    },
    "sameAs": [
      "https://github.com/jayasukuv11-beep/agenthelm",
      "https://pypi.org/project/agenthelm-sdk",
      "https://www.npmjs.com/package/agenthelm-node-sdk"
    ]
  }
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PWM54HPR');
            `,
          }}
        />
        {/* End Google Tag Manager */}
        {/* Google Analytics */}
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-B6S8E90CHW"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-B6S8E90CHW');
            `,
          }}
        />
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable} bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-[#ff5722] selection:text-white`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PWM54HPR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
