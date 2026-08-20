"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Eye, Sparkles, Save, Plus, Trash2 } from 'lucide-react'

export default function PolicyEnginePage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'gated' | 'auto' | 'shadow' | 'disabled'>('gated')
  const [minEvidence, setMinEvidence] = useState(60)
  const [rejectRules, setRejectRules] = useState<any[]>([])
  const [gateRules, setGateRules] = useState<any[]>([])
  const [autoRules, setAutoRules] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [newRuleName, setNewRuleName] = useState('')
  const [newRulePattern, setNewRulePattern] = useState('')
  const [newRuleType, setNewRuleType] = useState<'reject' | 'gate' | 'auto'>('gate')

  useEffect(() => {
    async function loadProjects() {
      const { data: projs } = await supabase.from('projects').select('id, name').order('created_at', { ascending: false })
      if (projs && projs.length > 0) {
        setProjects(projs)
        setSelectedProjectId(projs[0].id)
      }
      setLoading(false)
    }
    loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return
    async function loadPolicyAndLogs() {
      const [policyRes, logsRes] = await Promise.all([
        supabase.from('project_policies').select('*').eq('project_id', selectedProjectId).maybeSingle(),
        supabase.from('policy_audit_log').select('*').eq('project_id', selectedProjectId).order('created_at', { ascending: false }).limit(20)
      ])

      if (policyRes.data) {
        setMode(policyRes.data.mode || 'gated')
        setMinEvidence(policyRes.data.thresholds?.min_evidence_score || 60)
        setRejectRules(policyRes.data.reject_rules || [])
        setGateRules(policyRes.data.gate_rules || [])
        setAutoRules(policyRes.data.auto_apply_rules || [])
      } else {
        setMode('gated')
        setMinEvidence(60)
        setRejectRules([])
        setGateRules([])
        setAutoRules([])
      }

      setAuditLogs(logsRes.data || [])
    }
    loadPolicyAndLogs()
  }, [selectedProjectId])

  const handleSave = async () => {
    if (!selectedProjectId) return
    setSaving(true)
    try {
      await supabase.from('project_policies').upsert({
        project_id: selectedProjectId,
        mode,
        thresholds: { min_evidence_score: minEvidence, max_risk_level: 'medium' },
        reject_rules: rejectRules,
        gate_rules: gateRules,
        auto_apply_rules: autoRules,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id' })
      alert('Policy updated successfully')
    } catch (err: any) {
      alert(`Error saving policy: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddRule = () => {
    if (!newRuleName.trim()) return
    const rule = { name: newRuleName.trim(), pattern: newRulePattern.trim() || undefined }
    if (newRuleType === 'reject') setRejectRules([...rejectRules, rule])
    else if (newRuleType === 'gate') setGateRules([...gateRules, rule])
    else if (newRuleType === 'auto') setAutoRules([...autoRules, rule])

    setNewRuleName('')
    setNewRulePattern('')
  }

  const handleRemoveRule = (type: 'reject' | 'gate' | 'auto', index: number) => {
    if (type === 'reject') setRejectRules(rejectRules.filter((_, i) => i !== index))
    else if (type === 'gate') setGateRules(gateRules.filter((_, i) => i !== index))
    else if (type === 'auto') setAutoRules(autoRules.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-black text-ink tracking-tight">Policy Engine</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sarvam-soft text-sarvam font-bold">
              Sarvam AI Governed
            </span>
          </div>
          <p className="text-muted font-mono text-xs mt-1">
            Configure automated proposal gates, security backstops, and audit logging for AI agent fleets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-paper-card border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink shadow-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-vermilion hover:bg-vermilion-dark text-white font-mono text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            id: 'gated',
            title: 'Gated Mode',
            badge: 'Default / Safe',
            desc: 'All agent knowledge proposals require human approval before being merged.',
            icon: ShieldAlert,
            color: 'border-vermilion text-vermilion'
          },
          {
            id: 'auto',
            title: 'Auto Mode',
            badge: 'High Velocity',
            desc: 'Proposals with high evidence scores (≥ threshold) auto-merge into project memory.',
            icon: CheckCircle2,
            color: 'border-moss text-moss'
          },
          {
            id: 'shadow',
            title: 'Shadow Mode',
            badge: 'Observation Only',
            desc: 'Simulate policy evaluations and log audit records without blocking agents.',
            icon: Eye,
            color: 'border-sarvam text-sarvam'
          },
          {
            id: 'disabled',
            title: 'Disabled',
            badge: 'No Governance',
            desc: 'Bypass policy evaluations (hardcoded prompt injection & credential backstops still apply).',
            icon: XCircle,
            color: 'border-muted text-muted'
          }
        ].map((m) => {
          const isSelected = mode === m.id
          return (
            <div
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all bg-paper-card shadow-sm flex flex-col justify-between
                ${isSelected ? `${m.color} bg-paper-dim/30 shadow-md` : 'border-line hover:border-ink-soft'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-ink text-sm">{m.title}</span>
                  <m.icon className={`w-4 h-4 ${isSelected ? m.color : 'text-muted'}`} />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-paper-dim text-ink-soft">
                  {m.badge}
                </span>
                <p className="text-muted font-mono text-xs mt-3 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Threshold & Rules */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Evidence Threshold & Add Rule */}
        <div className="bg-paper-card border border-line rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-ink text-base mb-1">Auto-Apply Evidence Threshold</h3>
            <p className="text-muted font-mono text-xs mb-4">Minimum deterministic + Sarvam evidence score required for automatic merge.</p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="30"
                max="95"
                value={minEvidence}
                onChange={(e) => setMinEvidence(Number(e.target.value))}
                className="w-full accent-vermilion"
              />
              <span className="font-mono font-bold text-sm text-vermilion min-w-[50px] text-right">
                {minEvidence}/100
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-line">
            <h3 className="font-display font-bold text-ink text-sm mb-3">Add Custom Policy Rule</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Rule Name (e.g. Block DB Drops)"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="bg-paper-dim/40 border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink"
                />
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as any)}
                  className="bg-paper-dim/40 border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink"
                >
                  <option value="reject">Reject Rule (Hard Block)</option>
                  <option value="gate">Gate Rule (Force Review)</option>
                  <option value="auto">Auto-Apply Rule</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Regex Pattern (e.g. drop table|truncate)"
                value={newRulePattern}
                onChange={(e) => setNewRulePattern(e.target.value)}
                className="w-full bg-paper-dim/40 border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink"
              />
              <button
                onClick={handleAddRule}
                className="w-full bg-paper-dim hover:bg-line text-ink font-mono text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>
          </div>
        </div>

        {/* Active Rules List */}
        <div className="bg-paper-card border border-line rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-ink text-base">Active Policy Rules</h3>
          
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {/* Hardcoded Backstop */}
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono">
              <div className="flex items-center justify-between text-red-700 font-bold mb-1">
                <span>🛡️ Hardcoded Backstop (Active)</span>
                <span className="text-[10px] bg-red-200 px-1.5 py-0.5 rounded">Non-overridable</span>
              </div>
              <p className="text-red-900 text-[11px]">
                Rejects prompt injections, AWS keys, GitHub PATs, and secret leaks automatically.
              </p>
            </div>

            {/* Reject Rules */}
            {rejectRules.map((r, i) => (
              <div key={i} className="p-3 bg-paper-dim/40 border border-line rounded-lg text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-vermilion font-bold">[REJECT] {r.name}</span>
                  {r.pattern && <span className="block text-muted text-[11px]">Pattern: /{r.pattern}/</span>}
                </div>
                <button onClick={() => handleRemoveRule('reject', i)} className="text-muted hover:text-vermilion">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Gate Rules */}
            {gateRules.map((r, i) => (
              <div key={i} className="p-3 bg-paper-dim/40 border border-line rounded-lg text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-amber font-bold">[GATE] {r.name}</span>
                  {r.pattern && <span className="block text-muted text-[11px]">Pattern: /{r.pattern}/</span>}
                </div>
                <button onClick={() => handleRemoveRule('gate', i)} className="text-muted hover:text-vermilion">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Auto Rules */}
            {autoRules.map((r, i) => (
              <div key={i} className="p-3 bg-paper-dim/40 border border-line rounded-lg text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-moss font-bold">[AUTO] {r.name}</span>
                  {r.pattern && <span className="block text-muted text-[11px]">Pattern: /{r.pattern}/</span>}
                </div>
                <button onClick={() => handleRemoveRule('auto', i)} className="text-muted hover:text-vermilion">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {rejectRules.length === 0 && gateRules.length === 0 && autoRules.length === 0 && (
              <p className="text-muted font-mono text-xs text-center py-6">No custom rules added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-paper-card border border-line rounded-xl p-5 shadow-sm">
        <h3 className="font-display font-bold text-ink text-base mb-4">Policy Audit Log (Real-Time)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs font-mono divide-y divide-line">
            <thead>
              <tr className="text-muted uppercase tracking-wider">
                <th className="py-2.5">Time</th>
                <th className="py-2.5">Decision</th>
                <th className="py-2.5">Mode</th>
                <th className="py-2.5">Reason</th>
                <th className="py-2.5">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-ink-soft">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 text-muted">{new Date(log.created_at).toLocaleTimeString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px]
                      ${log.decision === 'allow' ? 'bg-moss-soft text-moss' :
                        log.decision === 'reject' ? 'bg-vermilion-soft text-vermilion' :
                        'bg-amber-soft text-amber'}`}
                    >
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{log.mode}</td>
                  <td className="py-3 font-medium text-ink max-w-md truncate">{log.reason}</td>
                  <td className="py-3 text-muted">{log.elapsed_ms || 12}ms</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">No policy evaluations recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
