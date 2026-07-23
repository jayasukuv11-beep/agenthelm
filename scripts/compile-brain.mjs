#!/usr/bin/env node
/**
 * AgentHelm Brain Compiler CLI Script
 * Used by GitHub Actions to compile Project Brain snapshots on PR merge.
 */

import { execSync } from 'child_process';

const BASE_URL = process.env.AGENTHELM_BASE_URL || 'https://agenthelm.online';
const CONNECT_KEY = process.env.AGENTHELM_CONNECT_KEY;
const PROJECT_ID = process.env.AGENTHELM_PROJECT;

if (!CONNECT_KEY || !PROJECT_ID) {
  console.error('❌ Error: AGENTHELM_CONNECT_KEY and AGENTHELM_PROJECT must be set.');
  process.exit(1);
}

try {
  console.log('🧠 Running AgentHelm Brain Compiler Action...');

  // Extract recent commit message and changed files
  const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
  const diffFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  const proposalBody = {
    key: CONNECT_KEY,
    project: PROJECT_ID,
    summary: `PR Merge: ${commitMsg.slice(0, 100)}`,
    decisions: [`Automated compile from commit: ${commitMsg.slice(0, 150)}`],
    files_modified: diffFiles.slice(0, 20),
    confidence: 95,
    source_type: 'git_commit'
  };

  console.log(`Submitting Knowledge Proposal for project ${PROJECT_ID}...`);

  const res = await fetch(`${BASE_URL}/api/sdk/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposalBody)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Compiler proposal failed (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log(`✅ Brain Proposal Submitted Successfully! ID: ${data.id || 'ok'}`);
} catch (err) {
  console.error('❌ Brain Compiler Action failed:', err.message);
  process.exit(1);
}
