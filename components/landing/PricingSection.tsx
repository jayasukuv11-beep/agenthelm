'use client'

import { motion } from "framer-motion"

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">PRICING</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            Free for individuals and small teams. Scale with confidence as your projects grow.
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
            <div className={`bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px] h-full flex flex-col`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Free
                </h3>
                <p className="font-mono text-sm text-orange-500 uppercase tracking-wider">
                  $0
                </p>
              </div>
              <p className="text-zinc-500 font-mono text-sm mb-6">
                Perfect for individual developers and small projects
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-zinc-400">
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Up to 3 agents
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Project Brain (1GB storage)
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Basic pipeline
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Community support
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <a href="/login" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-6 py-3 transition-all flex items-center justify-center gap-2">
                  Get Started Free <span className="w-4 h-4">→</span>
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
            <div className={`bg-[#111] border border-orange-500/30 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px] h-full flex flex-col`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Pro
                </h3>
                <p className="font-mono text-sm text-orange-500 uppercase tracking-wider">
                  $29/month
                </p>
              </div>
              <p className="text-zinc-500 font-mono text-sm mb-6">
                Ideal for professional developers and growing teams
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-zinc-400">
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Unlimited agents
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Project Brain (100GB storage)
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Full pipeline with custom rules
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Priority support
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Advanced analytics
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <a href="/login" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-6 py-3 transition-all flex items-center justify-center gap-2">
                  Start Free Trial <span className="w-4 h-4">→</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div
            key="plan-enterprise"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <div className={`bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px] h-full flex flex-col`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Enterprise
                </h3>
                <p className="font-mono text-sm text-orange-500 uppercase tracking-wider">
                  Custom
                </p>
              </div>
              <p className="text-zinc-500 font-mono text-sm mb-6">
                For organizations with custom security, compliance, and scale needs
              </p>
              <ul className="space-y-3 flex-1 mb-6 font-mono text-zinc-400">
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Unlimited everything
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Dedicated Project Brain clusters
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  Custom pipeline & compliance
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  24/7 dedicated support
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  On-premise deployment
                </li>
                <li>
                  <span className="w-3 h-3 bg-orange-500/20 rounded-full flex-shrink-0" />
                  SLA & account management
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <a href="/contact" className="w-full border border-orange-500/30 text-orange-500 hover:text-white hover:bg-orange-500/10 font-mono font-bold text-sm px-6 py-3 transition-all flex items-center justify-center gap-2">
                  Contact Sales <span className="w-4 h-4">→</span>
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
          className="mt-16"
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-6 text-center">
            Feature Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-zinc-800">
              <thead>
                <tr className="bg-[#111]">
                  <th className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800"></th>
                  <th className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Free</th>
                  <th className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Pro</th>
                  <th className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Monthly Price</td>
                  <td className="p-4 font-mono text-sm text-center text-orange-500">$0</td>
                  <td className="p-4 font-mono text-sm text-center text-orange-500">$29</td>
                  <td className="p-4 font-mono text-sm text-center text-orange-500">Custom</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Agents</td>
                  <td className="p-4 font-mono text-sm text-center">3</td>
                  <td className="p-4 font-mono text-sm text-center">Unlimited</td>
                  <td className="p-4 font-mono text-sm text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Brain Storage</td>
                  <td className="p-4 font-mono text-sm text-center">1GB</td>
                  <td className="p-4 font-mono text-sm text-center">100GB</td>
                  <td className="p-4 font-mono text-sm text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Pipeline Stages</td>
                  <td className="p-4 font-mono text-sm text-center">Basic</td>
                  <td className="p-4 font-mono text-sm text-center">Full</td>
                  <td className="p-4 font-mono text-sm text-center">Customizable</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Support</td>
                  <td className="p-4 font-mono text-sm text-center">Community</td>
                  <td className="p-4 font-mono text-sm text-center">Priority</td>
                  <td className="p-4 font-mono text-sm text-center">Dedicated</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">SLA</td>
                  <td className="p-4 font-mono text-sm text-center">None</td>
                  <td className="p-4 font-mono text-sm text-center">Standard</td>
                  <td className="p-4 font-mono text-sm text-center">Enterprise</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-4 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800">Custom Contracts</td>
                  <td className="p-4 font-mono text-sm text-center">✗</td>
                  <td className="p-4 font-mono text-sm text-center">✗</td>
                  <td className="p-4 font-mono text-sm text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          key="pricing-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-4">
            Ready to Build Your Project Brain?
          </h3>
          <p className="text-zinc-500 font-mono text-sm mb-6 max-w-xl mx-auto">
            Start free, scale as you grow. No vendor lock-in, ever.
          </p>
          <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center justify-center gap-2">
            Get Started Free <span className="w-4 h-4">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}