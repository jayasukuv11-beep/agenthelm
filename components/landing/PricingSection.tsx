"use client"

import { motion } from "framer-motion"
import { Check, HelpCircle, ArrowRight, X } from "lucide-react"

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-[#08080a] border-y border-zinc-900 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-[0.3em] block mb-3">PRICING</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-zinc-400 font-mono text-sm max-w-xl mx-auto">
            Get started free, unlock advanced failure tracing on Indie, or orchestrate agent swarms on Studio.
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
            <div className="bg-[#111113] border border-zinc-800 p-6 rounded-2xl transition-all hover:border-zinc-700 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Free
                </h3>
                <p className="font-mono text-lg font-bold text-indigo-400">
                  $0
                </p>
              </div>
              <p className="text-zinc-500 font-mono text-xs mb-6">
                Perfect for individuals and small personal projects.
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  3 Agents limit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  100,000 tokens/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  7-day log history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Telegram alerts & control
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-zinc-800/50">
                <a href="/login" className="w-full bg-[#1e1e22] hover:bg-[#27272a] text-white font-mono font-bold text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Indie Tier */}
          <motion.div
            key="plan-indie"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="bg-[#111113] border border-indigo-500/20 p-6 rounded-2xl transition-all hover:border-indigo-500/40 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.15)] h-full flex flex-col relative">
              <div className="absolute -top-3 right-6 bg-indigo-600 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 font-bold rounded">
                Popular
              </div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Indie
                </h3>
                <p className="font-mono text-lg font-bold text-indigo-400">
                  $19<span className="text-zinc-500 text-xs font-normal">/mo</span>
                </p>
              </div>
              <p className="text-zinc-500 font-mono text-xs mb-6">
                Ideal for indie developers building production wrappers.
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  10 Agents limit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  2,000,000 tokens/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  30-day log history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  AI failure explanations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  All anomaly alerts
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-zinc-800/50">
                <a href="/login" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)] rounded">
                  Upgrade to Indie <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Studio Tier */}
          <motion.div
            key="plan-studio"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <div className="bg-[#111113] border border-zinc-800 p-6 rounded-2xl transition-all hover:border-zinc-700 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Studio
                </h3>
                <p className="font-mono text-lg font-bold text-indigo-400">
                  $99<span className="text-zinc-500 text-xs font-normal">/mo</span>
                </p>
              </div>
              <p className="text-zinc-500 font-mono text-xs mb-6">
                For orchestrating agent teams and visual cost breakdowns.
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  1,000 Agents limit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Unlimited tokens usage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  90-day log history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Swarms orchestration
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Trace Replay (Time-Travel)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Visual Cost Breakdown
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-zinc-800/50">
                <a href="/login" className="w-full bg-[#1e1e22] hover:bg-[#27272a] text-white font-mono font-bold text-xs uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-2 rounded">
                  Upgrade to Studio <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Comparison Chart */}
        <motion.div
          key="pricing-comparison"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20"
        >
          <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-6 text-center">
            Feature Comparison
          </h3>
          <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-[#111113]">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#161619]/80 border-b border-zinc-800">
                  <th className="p-4 font-mono text-xs font-bold text-left text-zinc-400 uppercase tracking-widest">Core Feature</th>
                  <th className="p-4 font-mono text-xs font-bold text-center text-white uppercase tracking-widest">Free</th>
                  <th className="p-4 font-mono text-xs font-bold text-center text-white uppercase tracking-widest">Indie</th>
                  <th className="p-4 font-mono text-xs font-bold text-center text-white uppercase tracking-widest">Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-xs text-zinc-300">
                <tr>
                  <td className="p-4 font-bold text-white uppercase tracking-wide">Monthly Price</td>
                  <td className="p-4 text-center text-orange-500 font-bold">$0</td>
                  <td className="p-4 text-center text-orange-500 font-bold">$19</td>
                  <td className="p-4 text-center text-orange-500 font-bold">$99</td>
                </tr>
                <tr>
                  <td className="p-4">Agents Included</td>
                  <td className="p-4 text-center">3</td>
                  <td className="p-4 text-center">10</td>
                  <td className="p-4 text-center">1,000</td>
                </tr>
                <tr>
                  <td className="p-4">Token Budget / mo</td>
                  <td className="p-4 text-center">100K</td>
                  <td className="p-4 text-center">2.0M</td>
                  <td className="p-4 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4">Log Retention</td>
                  <td className="p-4 text-center">7 days</td>
                  <td className="p-4 text-center">30 days</td>
                  <td className="p-4 text-center">90 days</td>
                </tr>
                <tr>
                  <td className="p-4">Telegram Alerts</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">AI Failure Explanations</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Anomaly Alerts</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Swarms Orchestration</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Trace Replay (Time-Travel)</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Visual Cost Breakdown</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-zinc-600 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Enterprise Callout */}
        <motion.div
          key="pricing-enterprise"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center p-6 border border-zinc-800 rounded-xl bg-[#111113] max-w-2xl mx-auto"
        >
          <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">Need Custom Scaling or Security?</h4>
          <p className="font-mono text-xs text-zinc-400 mb-4">
            Get dedicated brain clusters, on-prem deployment, custom SLAs, and dedicated priority support.
          </p>
          <a href="/contact" className="inline-flex items-center gap-1.5 font-mono text-xs text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest hover:underline">
            Contact Enterprise Sales <span className="w-3.5 h-3.5">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}