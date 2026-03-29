import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "AgentHelm — AI Agent Control Plane",
  description: "Monitor, control and debug your AI agents with one line of code. Free for 3 agents.",
  openGraph: {
    title: "AgentHelm — AI Agent Control Plane",
    description: "Monitor, control and debug your AI agents with one line of code. Free for 3 agents.",
    type: "website",
    url: "https://agenthelm.online",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentHelm — AI Agent Control Plane",
    description: "Monitor, control and debug your AI agents with one line of code.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-[#09090b] text-white antialiased`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
