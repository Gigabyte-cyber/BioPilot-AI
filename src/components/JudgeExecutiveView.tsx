import React from 'react';
import {
  Award,
  CheckCircle2,
  Cpu,
  FileCheck,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  CandidateIntervention,
  EvidenceScore,
  FermentationPhase,
  ProcessPoint,
  RiskAssessment,
  RootCauseAnalysis,
  TrajectoryMetrics,
} from '../types/bioprocess';

interface JudgeExecutiveViewProps {
  current: ProcessPoint;
  phase: FermentationPhase;
  risk: RiskAssessment;
  rootCause: RootCauseAnalysis;
  bestIntervention: CandidateIntervention | null;
  evidence: EvidenceScore;
  trajectories: TrajectoryMetrics;
  onOpenApprovalModal: () => void;
  isHumanApproved: boolean;
}

export const JudgeExecutiveView: React.FC<JudgeExecutiveViewProps> = ({
  current,
  phase,
  risk,
  rootCause,
  bestIntervention,
  evidence,
  trajectories,
  onOpenApprovalModal,
  isHumanApproved,
}) => {
  const isCritical = risk.overallLevel === 'CRITICAL';
  const isWarning = risk.overallLevel === 'WARNING';

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl mb-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧬</span>
            <h2 className="text-xl font-black tracking-tight text-white">
              BIOPILOT <span className="text-cyan-400">AI</span>
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 ml-2">
              Judge & Executive Briefing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            High-Density Single-Screen Digital Bioprocess Decision Intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">
            Batch Time: <strong className="text-cyan-300 text-sm">{current.time.toFixed(1)} h</strong>
          </span>
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              isCritical
                ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                : isWarning
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}
          >
            {risk.overallLevel} RISK
          </span>
        </div>
      </div>

      {/* 4 Core Executive Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Panel 1: SENSE & TRAJECTORY (What is happening?) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              1. SENSE & TRAJECTORY (Current Physical State)
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-center mb-3">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Dissolved O₂</div>
                <div className={`text-lg font-bold ${current.do < 20 ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {current.do.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500">{trajectories.do.rateText}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Biomass (X)</div>
                <div className="text-lg font-bold text-white">{current.biomass.toFixed(2)} g/L</div>
                <div className="text-[9px] text-slate-500">{trajectories.biomass.rateText}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">O₂ Balance</div>
                <div className={`text-lg font-bold ${current.oxygenBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {current.oxygenBalance > 0 ? `+${current.oxygenBalance.toFixed(1)}` : current.oxygenBalance.toFixed(1)}
                </div>
                <div className="text-[9px] text-slate-500">mmol/L/h</div>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-snug">
              <span className="font-bold text-slate-200">Current Phase: </span>
              <span className="text-cyan-300 font-semibold">{phase}</span>. Cellular culture consuming carbon at high specific growth rate (μ = {current.specificGrowthRate.toFixed(2)} h⁻¹).
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 font-mono">
            Trajectory direction: {trajectories.do.interpretation}
          </div>
        </div>

        {/* Panel 2: DIAGNOSE & ROOT CAUSE (Why is it happening?) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Search className="w-3.5 h-3.5" />
              2. DIAGNOSE & ROOT CAUSE (Engineering Problem)
            </div>

            <div className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              {rootCause.problem}
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-xs text-slate-300 mb-2 leading-relaxed">
              <span className="font-bold text-amber-300 block mb-0.5 text-[10px] uppercase">
                Most Likely Contributing Factor:
              </span>
              {rootCause.likelyContributingFactor}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Primary Concern:</span>
            <span className="font-bold text-rose-300">{risk.primaryConcern}</span>
          </div>
        </div>

        {/* Panel 3: SIMULATE & OPTIMIZE (What is the best intervention?) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5" />
              3. SIMULATE & OPTIMIZE (Candidate Intervention)
            </div>

            {bestIntervention ? (
              <div>
                <div className="text-sm font-extrabold text-white mb-2">
                  Candidate #1:{' '}
                  <span className="text-cyan-300 font-mono">
                    Aeration {bestIntervention.aeration} vvm + Agitation {bestIntervention.agitation} rpm
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Projected DO</span>
                    <span className="text-base font-bold text-emerald-300">+{(bestIntervention.projectedDO ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Projected Balance</span>
                    <span className="text-base font-bold text-emerald-300">+{(bestIntervention.oxygenBalance ?? 0).toFixed(1)} mM/h</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-snug">{bestIntervention.rationale}</p>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Baseline parameters nominal.</div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 font-mono">
            Simulated in virtual twin across 25 operating matrices (Euler / Runge-Kutta 4).
          </div>
        </div>

        {/* Panel 4: EXPLAIN & HUMAN GATE (Keep humans in control) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5 mb-2">
              <FileCheck className="w-3.5 h-3.5" />
              4. EXPLAINABILITY & HUMAN REVIEW GATE
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 font-semibold">Evidence Verification:</span>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                {evidence.classification} ({evidence.score}/{evidence.maxScore} indicators)
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-300 mb-3">
              {evidence.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Human Governance</div>
              <div className="text-xs font-bold text-white">
                {isHumanApproved ? 'Operator Signature Verified' : 'Approval Gate Required'}
              </div>
            </div>
            <button
              onClick={onOpenApprovalModal}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                isHumanApproved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              }`}
            >
              {isHumanApproved ? 'View Signature' : 'Authorize Action'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Competition Summary Statement */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-center">
        <p className="text-xs font-semibold text-slate-300">
          <strong className="text-white uppercase tracking-wider text-[11px] mr-1">Engineering Takeaway:</strong>
          BioPilot AI demonstrates how agentic AI and virtual bioprocess twins prevent batch failure through deterministic trajectory intelligence, transparent mass-transfer modeling, and mandatory human authorization.
        </p>
      </div>
    </div>
  );
};
