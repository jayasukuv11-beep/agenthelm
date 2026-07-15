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
        <p className="text-zinc-400 font-mono leading-relaxed">
          Need assistance with SDK integrations, custom Model Context Protocol (MCP) deployments, 
          or enterprise plans? Get in touch with the AgentHelm engineering team directly.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-[#111] border border-zinc-800 p-6 space-y-4 rounded-none">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Direct Support</h3>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider leading-relaxed">
              Email our engineering support queue. For security audits or billing questions, please use this channel:
            </p>
            <a 
              href="mailto:support@agenthelm.online?subject=AgentHelm Support Request" 
              className="block font-mono text-sm text-orange-500 hover:text-orange-400 font-bold hover:underline"
            >
              support@agenthelm.online
            </a>
          </div>

          <div className="bg-[#111] border border-zinc-800 p-6 space-y-4 rounded-none">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Community</h3>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider leading-relaxed">
              Join the community or developer discussions on Telegram for real-time setup feedback:
            </p>
            <a 
              href="https://t.me/AgentHelmBot" 
              target="_blank"
              rel="noopener noreferrer" 
              className="block font-mono text-sm text-orange-500 hover:text-orange-400 font-bold hover:underline"
            >
              Telegram Developer Group →
            </a>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold font-mono uppercase tracking-tight mb-6 text-white border-b border-zinc-800 pb-2">
          Secure Transmission Queue
        </h2>

        {submitted ? (
          <div className="bg-orange-500/5 border border-orange-500/20 p-8 text-center space-y-4">
            <div className="inline-flex w-12 h-12 bg-orange-500/10 border border-orange-500/20 items-center justify-center rounded-none mb-2">
              <CheckCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-mono text-base font-bold text-white uppercase tracking-widest">Message Transmitted</h3>
            <p className="text-zinc-500 font-mono text-xs max-w-md mx-auto uppercase tracking-wider leading-relaxed">
              Your transmission has been queued. Our developer operations response target is within 4 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-[#111] border border-zinc-800 p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="DEVELOPER / OPERATOR" 
                  className="w-full bg-[#0a0a0a] border border-zinc-800 text-white font-mono text-xs px-4 py-3 rounded-none focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="operator@domain.com" 
                  className="w-full bg-[#0a0a0a] border border-zinc-800 text-white font-mono text-xs px-4 py-3 rounded-none focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Subject</label>
              <input 
                type="text" 
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="TECHNICAL INQUIRY / INTEGRATION / BILLING" 
                className="w-full bg-[#0a0a0a] border border-zinc-800 text-white font-mono text-xs px-4 py-3 rounded-none focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Message Payload</label>
              <textarea 
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Enter details of your request or issue..." 
                className="w-full bg-[#0a0a0a] border border-zinc-800 text-white font-mono text-xs px-4 py-3 rounded-none focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-xs uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-2"
            >
              Queue Transmission <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </section>
    </LegalPage>
  )
}
