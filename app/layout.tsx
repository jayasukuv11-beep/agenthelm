import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentHelm — AI Agent Control Plane",
  description: "Monitor, control and debug your AI agents with one line of code. Free for 3 agents.",
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
