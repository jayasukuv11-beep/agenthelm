'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What is an AI agent control plane?',
    a: 'A control plane sits between your autonomous AI agents and the tools they call. AgentHelm adds human-in-the-loop approvals, audit trails, budget guardrails, and a shared memory layer (Project Brain) so agents stay accountable and recoverable in production.',
  },
  {
    q: 'How do I add human-in-the-loop approvals to my LLM agent?',
    a: 'Point your agent\'s SDK calls through AgentHelm. High-risk actions (sending email, posting, payments) are held for approval via Telegram. Approve or reject from your phone — the agent waits fail-closed until you decide.',
  },
  {
    q: 'Does AgentHelm work with any agent framework?',
    a: 'Yes. AgentHelm wraps around any framework (LangChain, AutoGen, CrewAI, custom loops) through a lightweight SDK and MCP server. You keep your existing agent code — AgentHelm governs the boundaries.',
  },
  {
    q: 'How are AI agent costs controlled?',
    a: 'AgentHelm enforces per-agent and per-project budget guardrails, tracks token and tool-call spend in real time, and alerts or halts agents that exceed limits. Billing is India-first in INR via Cashfree.',
  },
  {
    q: 'Is AgentHelm secure and multi-tenant isolated?',
    a: 'Yes. AgentHelm is fail-closed by default, scopes credentials per agent, enforces tenant isolation at the database row level, and keeps a complete, tamper-evident audit trail of every decision an agent makes.',
  },
  {
    q: 'Which LLM does AgentHelm use?',
    a: 'AgentHelm is powered by Sarvam AI\'s models for its governance intelligence (explanations, intent parsing, evaluations). Your own agents can run on any model — AgentHelm governs them regardless of provider.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 bg-paper-dim/40 border-y border-line">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
            Questions, answered.
          </h2>
          <p className="text-ink-soft text-sm max-w-xl mx-auto leading-relaxed">
            Everything you need to know about governing autonomous agents in production.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-xl border border-line bg-paper-card overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-ink text-[15px]">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-ink-soft shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-ink-soft text-sm leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted mt-10">
          Still curious?{' '}
          <a href="/docs" className="text-vermilion hover:underline font-medium">
            Read the docs
          </a>{' '}
          or{' '}
          <a href="/login" className="text-vermilion hover:underline font-medium">
            start free
          </a>
          .
        </p>
      </div>
    </section>
  );
}
