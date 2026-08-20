"use client"

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Github, Upload, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Loader2, Globe, BookOpen, Database } from 'lucide-react'

export default function OnboardingPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'github' | 'upload'>('github')

  React.useEffect(() => {
    async function loadProjects() {
      const { data: projs } = await supabase.from('projects').select('id, name').order('created_at', { ascending: false })
      if (projs && projs.length > 0) {
        setProjects(projs)
        setSelectedProjectId(projs[0].id)
      }
    }
    loadProjects()
  }, [])

  const handleGitHubSeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !repoUrl) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/integrations/github/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProjectId, repo_url: repoUrl, github_token: githubToken || undefined })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Seeding failed')
      setResult(data.result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !uploadFile) return
    setUploadLoading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('project_id', selectedProjectId)

      const res = await fetch('/api/brain/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUploadResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-line">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-display font-black text-ink tracking-tight">Repository Onboarding</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sarvam-soft text-sarvam font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Sarvam AI
          </span>
        </div>
        <p className="text-muted font-mono text-xs">
          Seed your Project Brain from a GitHub repository or uploaded documentation using Sarvam-105B document intelligence.
        </p>
      </div>

      {/* Project Selector */}
      <div>
        <label className="block text-xs font-mono font-bold text-ink-soft uppercase tracking-wider mb-2">Target Project</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full bg-paper-card border border-line rounded-lg px-3 py-2.5 text-sm font-mono text-ink shadow-sm"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2 bg-paper-dim/40 rounded-xl p-1.5 border border-line">
        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-xs font-bold transition-all
            ${activeTab === 'github' ? 'bg-ink text-paper shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          <Github className="w-3.5 h-3.5" /> GitHub Repo Seed
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-xs font-bold transition-all
            ${activeTab === 'upload' ? 'bg-ink text-paper shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          <Upload className="w-3.5 h-3.5" /> Document Upload
        </button>
      </div>

      {/* GitHub Seeding */}
      {activeTab === 'github' && (
        <div className="bg-paper-card border border-line rounded-xl p-6 shadow-sm">
          <h2 className="font-display font-bold text-ink text-base mb-1">Seed from GitHub Repository</h2>
          <p className="text-muted font-mono text-xs mb-5">
            AgentHelm extracts knowledge from README.md, OpenAPI specs, SQL schemas, Prisma schemas, Dockerfiles, and `.cursorrules` files.
          </p>

          <form onSubmit={handleGitHubSeed} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-ink-soft mb-1.5">GitHub Repository URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-paper-dim/40 border border-line rounded-lg text-sm font-mono text-ink"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-ink-soft mb-1.5">GitHub Personal Access Token <span className="text-muted font-normal">(optional, for private repos)</span></label>
              <input
                type="password"
                placeholder="ghp_..."
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper-dim/40 border border-line rounded-lg text-sm font-mono text-ink"
              />
            </div>

            {/* Files that will be scanned */}
            <div className="bg-paper-dim/40 rounded-lg border border-line p-4">
              <p className="text-xs font-mono font-bold text-ink-soft mb-2 uppercase tracking-wider">Files Scanned</p>
              <div className="grid grid-cols-2 gap-1.5">
                {['README.md', 'openapi.yaml', 'schema.sql', 'prisma/schema.prisma', '.cursorrules', 'CLAUDE.md', 'docker-compose.yml', 'Dockerfile'].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-[11px] font-mono text-ink-soft">
                    <BookOpen className="w-3 h-3 text-muted" /> {f}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProjectId || !repoUrl}
              className="w-full bg-vermilion hover:bg-vermilion-dark disabled:opacity-50 text-white font-mono text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Seeding with Sarvam-105B...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Seed Project Brain <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Seeding Result */}
          {result && (
            <div className="mt-4 p-4 bg-moss-soft border border-moss/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-moss" />
                <span className="font-mono text-sm font-bold text-moss">Brain Seeding Completed</span>
              </div>
              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div className="text-center">
                  <div className="text-2xl font-black text-ink">{result.entries_proposed}</div>
                  <div className="text-muted">Proposed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-moss">{result.entries_auto_applied}</div>
                  <div className="text-muted">Auto Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-amber">{result.entries_gated}</div>
                  <div className="text-muted">Gated for Review</div>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-3 text-[11px] font-mono text-muted">
                  {result.errors.slice(0, 3).map((e: string, i: number) => <div key={i}>⚠ {e}</div>)}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-vermilion-soft border border-vermilion/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-vermilion mt-0.5 shrink-0" />
              <span className="font-mono text-xs text-vermilion">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Document Upload */}
      {activeTab === 'upload' && (
        <div className="bg-paper-card border border-line rounded-xl p-6 shadow-sm">
          <h2 className="font-display font-bold text-ink text-base mb-1">Document Intelligence Upload</h2>
          <p className="text-muted font-mono text-xs mb-5">
            Upload architecture diagrams, OpenAPI specs, ERDs, or documentation files. Sarvam-105B extracts structured knowledge.
          </p>

          <form onSubmit={handleDocumentUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-ink-soft mb-1.5">Document File</label>
              <input
                type="file"
                accept=".md,.sql,.yaml,.json,.txt,.prisma"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm font-mono text-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-mono file:text-xs file:bg-paper-dim file:text-ink hover:file:bg-line"
              />
              <p className="text-muted text-[10px] font-mono mt-1.5">Supported: .md, .sql, .yaml, .json, .txt, .prisma</p>
            </div>

            <button
              type="submit"
              disabled={uploadLoading || !selectedProjectId || !uploadFile}
              className="w-full bg-sarvam hover:bg-sarvam/80 disabled:opacity-50 text-white font-mono text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {uploadLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Extracting Knowledge...</>
              ) : (
                <><Database className="w-4 h-4" /> Extract & Seed Brain <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {uploadResult && (
            <div className="mt-4 p-4 bg-moss-soft border border-moss/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-moss" />
                <span className="font-mono text-sm font-bold text-moss">Document Processed Successfully</span>
              </div>
              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div className="text-center">
                  <div className="text-2xl font-black text-ink">{uploadResult.entities_extracted}</div>
                  <div className="text-muted">Extracted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-moss">{uploadResult.proposals_auto_applied}</div>
                  <div className="text-muted">Auto Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-amber">{uploadResult.proposals_gated}</div>
                  <div className="text-muted">Gated</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-vermilion-soft border border-vermilion/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-vermilion mt-0.5 shrink-0" />
              <span className="font-mono text-xs text-vermilion">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
