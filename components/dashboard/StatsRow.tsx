import {
  GitBranch,
  FileText,
  Clock,
  Zap,
  Shield,
  Activity,
  CheckCircle
} from "lucide-react";
import { StatCard } from "./StatCard";

interface StatsRowProps {
  brainVersion: string;
  knowledgeEntries: number;
  pendingProposals: number;
  contextCoverage: number;
  pipelineSuccessRate: number;
  securityScore: number;
  latestPublish: string;
}

export function StatsRow({
  brainVersion,
  knowledgeEntries,
  pendingProposals,
  contextCoverage,
  pipelineSuccessRate,
  securityScore,
  latestPublish
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      <StatCard
        label="Brain Version"
        value={brainVersion}
        icon={GitBranch}
      />
      <StatCard
        label="Knowledge Entries"
        value={knowledgeEntries.toLocaleString()}
        icon={FileText}
      />
      <StatCard
        label="Pending Proposals"
        value={pendingProposals}
        icon={Clock}
      />
      <StatCard
        label="Context Coverage"
        value={`${contextCoverage}%`}
        icon={Zap}
      />
      <StatCard
        label="Pipeline Success"
        value={`${pipelineSuccessRate}%`}
        icon={Activity}
      />
      <StatCard
        label="Security Score"
        value={`${securityScore}%`}
        icon={Shield}
      />
      <StatCard
        label="Last Published"
        value={latestPublish}
        icon={CheckCircle}
      />
    </div>
  );
}
