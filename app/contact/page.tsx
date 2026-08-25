"use client"

import React, { useState } from "react"
import { LegalPage } from "@/components/legal/LegalPage"
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <LegalPage title="Contact Support" lastUpdated="July 15, 2026">
      <section className="space-y-6">
        <p className="text-muted leading-relaxed">
          Need assistance with SDK integrations, custom Model Context Protocol (MCP) deployments,
          or enterprise plans? Get in touch with the AgentHelm engineering team directly.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-paper-card border border-line p-6 space-y-4 rounded-2xl">
            <div className="w-10 h-10 bg-vermilion-soft border border-vermilion/20 flex items-center justify-center rounded-xl">
              <Mail className="w-5 h-5 text-vermilion" />
            </div>
            <h3 className="font-display text-base font-bold text-ink">Direct Support</h3>
            <p className="text-sm text-muted leading-relaxed">
              Email our engineering support queue. For security audits or billing questions, please use this channel:
            </p>
            <a
              href="mailto:support@agenthelm.online?subject=AgentHelm Support Request"
              className="block text-sm text-vermilion hover:text-vermilion-dark font-semibold hover:underline"
            >
              support@agenthelm.online
            </a>
          </div>

          <div className="bg-paper-card border border-line p-6 space-y-4 rounded-2xl">
            <div className="w-10 h-10 bg-vermilion-soft border border-vermilion/20 flex items-center justify-center rounded-xl">
              <MessageSquare className="w-5 h-5 text-vermilion" />
            </div>
            <h3 className="font-display text-base font-bold text-ink">Community</h3>
            <p className="text-sm text-muted leading-relaxed">
              Join the community or developer discussions on Telegram for real-time setup feedback:
            </p>
            <a
              href="https://t.me/AgentHelmBot"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-vermilion hover:text-vermilion-dark font-semibold hover:underline"
            >
              Telegram Developer Group →
            </a>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold font-display tracking-tight mb-6 text-ink border-b border-line pb-2">
          Secure Transmission Queue
        </h2>

        {submitted ? (
          <div className="bg-moss-soft border border-moss/30 p-8 text-center space-y-4 rounded-2xl">
            <div className="inline-flex w-12 h-12 bg-moss-soft border border-moss/20 items-center justify-center rounded-xl">
              <CheckCircle className="w-6 h-6 text-moss" />
            </div>
            <h3 className="font-display text-base font-bold text-ink">Message Transmitted</h3>
            <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
              Your transmission has been queued. Our developer operations response target is within 4 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-paper-card border border-line p-8 rounded-2xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-ink block">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Developer / Operator"
                  className="w-full bg-paper border border-line text-ink text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-vermilion/40 focus:border-vermilion transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-ink block">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="operator@domain.com"
                  className="w-full bg-paper border border-line text-ink text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-vermilion/40 focus:border-vermilion transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-ink block">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Technical Inquiry / Integration / Billing"
                className="w-full bg-paper border border-line text-ink text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-vermilion/40 focus:border-vermilion transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-ink block">Message</label>
              <textarea
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Enter details of your request or issue..."
                className="w-full bg-paper border border-line text-ink text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-vermilion/40 focus:border-vermilion transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="bg-vermilion hover:bg-vermilion-dark text-white font-semibold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Queue Transmission <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </section>
    </LegalPage>
  )
}
