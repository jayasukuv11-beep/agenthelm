"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, X } from "lucide-react"

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-paper-dim/40 border-y border-line relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">PRICING TIERS</span>
          <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-ink mb-4">
            Predictable, Sovereign AI Pricing
          </h2>
          <p className="text-muted font-mono text-sm max-w-xl mx-auto">
            Start free, scale with Pro, or power your entire engineering fleet on Team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <motion.div
            key="plan-free"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <div className="bg-paper-card border border-line p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold text-ink uppercase tracking-wider">
                  Free
                </h3>
                <p className="font-display text-2xl font-bold text-ink">
                  ₹0
                </p>
              </div>
              <p className="text-muted font-mono text-xs mb-6">
                For solo developers exploring shared project brain intelligence.
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-xs text-ink-soft">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-moss shrink-0" />
                  1 Agent & 1 Project
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-moss shrink-0" />
                  100 credits / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-moss shrink-0" />
                  50 Brain Entries max
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-moss shrink-0" />
                  Repo Seeding & JSON Export
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-line">
                <a href="/login" className="w-full bg-paper-dim hover:bg-line text-ink font-mono font-bold text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2 rounded-lg">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            key="plan-pro"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="bg-paper-card border-2 border-vermilion p-6 rounded-2xl transition-all shadow-md h-full flex flex-col relative">
              <div className="absolute -top-3 right-6 bg-vermilion text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 font-bold rounded-full">
                Most Popular
              </div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold text-ink uppercase tracking-wider">
                  Pro
                </h3>
                <p className="font-display text-2xl font-bold text-vermilion">
                  ₹499<span className="text-muted text-xs font-normal">/mo</span>
                </p>
              </div>
              <p className="text-muted font-mono text-xs mb-6">
                For professional builders running multi-agent workflows.
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-xs text-ink-soft">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
                  3 Agents & 3 Projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
                  2,000 credits / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
                  500 Brain Entries max
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
                  Sarvam Document Intelligence & OCR
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
                  Cross-Agent Analytics & Time-Saved ROI
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
                  Telegram Bot Remote Governance
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-line">
                <a href="/login" className="w-full bg-vermilion hover:bg-vermilion-dark text-white font-mono font-bold text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2 rounded-lg">
                  Upgrade to Pro <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Team Tier */}
          <motion.div
            key="plan-team"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <div className="bg-paper-card border border-line p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold text-ink uppercase tracking-wider">
                  Team
                </h3>
                <p className="font-display text-2xl font-bold text-ink">
                  ₹1,999<span className="text-muted text-xs font-normal">/mo</span>
                </p>
              </div>
              <p className="text-muted font-mono text-xs mb-6">
                For engineering organizations managing shared agent fleets.
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-xs text-ink-soft">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sarvam shrink-0" />
                  10 Agents & 10 Projects
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sarvam shrink-0" />
                  10,000 credits / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sarvam shrink-0" />
                  Unlimited Brain Entries
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sarvam shrink-0" />
                  Policy Engine Full Automation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sarvam shrink-0" />
                  Dedicated Sarvam AI Priority Quota
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-sarvam shrink-0" />
                  Audit Log Export & SSO Ready
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-line">
                <a href="/login" className="w-full bg-paper-dim hover:bg-line text-ink font-mono font-bold text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2 rounded-lg">
                  Upgrade to Team <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <div className="mt-16 bg-paper-card border border-line rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-line text-left text-xs font-mono">
            <thead className="bg-paper-dim">
              <tr>
                <th className="p-4 text-ink font-bold">Feature</th>
                <th className="p-4 text-ink font-bold text-center">Free</th>
                <th className="p-4 text-vermilion font-bold text-center">Pro</th>
                <th className="p-4 text-sarvam font-bold text-center">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-ink-soft">
              <tr>
                <td className="p-4 font-semibold text-ink">Monthly Credits</td>
                <td className="p-4 text-center">100</td>
                <td className="p-4 text-center">2,000</td>
                <td className="p-4 text-center">10,000</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-ink">Max Agents</td>
                <td className="p-4 text-center">1</td>
                <td className="p-4 text-center">3</td>
                <td className="p-4 text-center">10</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-ink">Max Brain Entries</td>
                <td className="p-4 text-center">50</td>
                <td className="p-4 text-center">500</td>
                <td className="p-4 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-ink">Sarvam Document Intelligence</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-muted mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-4 h-4 text-moss mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-4 h-4 text-moss mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-ink">Cross-Agent Analytics</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-muted mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-4 h-4 text-moss mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-4 h-4 text-moss mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-ink">Policy Engine Modes</td>
                <td className="p-4 text-center">Gated Only</td>
                <td className="p-4 text-center">All Modes</td>
                <td className="p-4 text-center">All Modes + Auto</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}