import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import {
  CandidateIntervention,
  EvidenceScore,
  RiskAssessment,
} from '../types/bioprocess';

interface ExplainableAIPanelProps {
  evidence: EvidenceScore;
  risk: RiskAssessment;
  bestIntervention: CandidateIntervention | null;
}

export const ExplainableAIPanel: React.FC<ExplainableAIPanelProps> = ({
  evidence,
  risk,
  bestIntervention,
}) => {
  // Safe values so the dashboard does not crash if data is temporarily unavailable.
  const score = Number(evidence?.score ?? 0);
  const maxScore = Number(evidence?.maxScore ?? 0);

  const evidenceItems = Array.isArray(evidence?.items)
    ? evidence.items
    : [];

  const evidencePercent =
    maxScore > 0
      ? Math.min(100, Math.max(0, (score / maxScore) * 100))
      : 0;

  const getEvidenceLabel = () => {
    if (score >= 4) return 'High Evidence';
    if (score >= 2) return 'Moderate Evidence';
    return 'Low Evidence';
  };

  const getEvidenceStyle = () => {
    if (score >= 4) {
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
    }

    if (score >= 2) {
      return 'bg-cyan-950/60 text-cyan-300 border-cyan-800';
    }

    return 'bg-amber-950/60 text-amber-300 border-amber-800';
  };

  const riskLevel = risk?.overallLevel ?? 'NORMAL';

  const isRiskActive =
    riskLevel === 'CRITICAL' ||
    riskLevel === 'WARNING';

  const recommendation =
    bestIntervention && isRiskActive
      ? `Increase aeration to ${Number(
          bestIntervention.aeration ?? 0
        ).toFixed(2)} vvm and agitation to ${Number(
          bestIntervention.agitation ?? 0
        ).toFixed(0)} rpm.`
      : 'Maintain the current operating strategy.';

  const projectedDO =
    Number(bestIntervention?.projectedDO ?? 0);

  const projectedOxygenBalance =
    Number(bestIntervention?.projectedOxygenBalance ?? 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4 text-left">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-800">

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Explainable AI
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Why BioPilot selected this recommendation
            </p>
          </div>
        </div>

        <div
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getEvidenceStyle()}`}
        >
          {getEvidenceLabel()} · {score}/{maxScore}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

        {/* Recommendation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">

          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-cyan-400" />

            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              AI Recommendation
            </span>
          </div>

          <div className="text-sm font-bold text-white leading-relaxed">
            {recommendation}
          </div>

          {/* Decision reasoning */}
          <div className="mt-4">

            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
              Decision Reasoning
            </div>

            <div className="space-y-2">

              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="text-cyan-400 font-bold">1</span>

                <span>
                  BioPilot evaluates the current process state and identifies
                  the dominant process risk.
                </span>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="text-cyan-400 font-bold">2</span>

                <span>
                  Process trajectory and model outputs are compared with
                  configured operating thresholds.
                </span>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="text-cyan-400 font-bold">3</span>

                <span>
                  Candidate interventions are evaluated in simulation before
                  a recommendation is presented.
                </span>
              </div>

            </div>
          </div>

          {/* Selected strategy */}
          {bestIntervention && (
            <div className="mt-4 pt-3 border-t border-slate-800">

              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                Selected Strategy
              </div>

              <div className="grid grid-cols-2 gap-2">

                <div className="bg-slate-900 rounded p-2">
                  <div className="text-[9px] text-slate-500">
                    Aeration
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    {Number(bestIntervention.aeration ?? 0).toFixed(2)} vvm
                  </div>
                </div>

                <div className="bg-slate-900 rounded p-2">
                  <div className="text-[9px] text-slate-500">
                    Agitation
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    {Number(bestIntervention.agitation ?? 0).toFixed(0)} rpm
                  </div>
                </div>

                <div className="bg-slate-900 rounded p-2">
                  <div className="text-[9px] text-slate-500">
                    Projected DO
                  </div>

                  <div className="text-xs font-bold text-cyan-300">
                    {projectedDO.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-900 rounded p-2">
                  <div className="text-[9px] text-slate-500">
                    O₂ Balance
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    {projectedOxygenBalance.toFixed(2)}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Evidence */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">

          <div className="flex items-center justify-between mb-3">

            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Evidence
              </div>

              <div className="text-[11px] text-slate-500 mt-0.5">
                Supporting indicators for the decision
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-cyan-300">
              {score}/{maxScore}
            </span>

          </div>

          {/* Evidence progress */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${evidencePercent}%` }}
            />
          </div>

          {/* Evidence items */}
          <div className="space-y-2">

            {evidenceItems.length > 0 ? (
              evidenceItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                    item.supported
                      ? 'bg-emerald-950/20 border-emerald-900/50'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >

                  {item.supported ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center justify-between gap-2">

                      <span className="text-[11px] font-semibold text-slate-200">
                        {item.label}
                      </span>

                      <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                        {item.metric}
                      </span>

                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      {item.detail}
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-[10px] text-slate-500">
                Evidence indicators are not available yet.
              </div>
            )}

          </div>

          {/* Classification */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">

            <span className="text-[10px] text-slate-500">
              Evidence classification
            </span>

            <span className="text-[10px] font-bold text-slate-300">
              {getEvidenceLabel()}
            </span>

          </div>

        </div>
      </div>

      {/* Method note */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-[9px] text-slate-500">

        <CheckCircle2 className="w-3 h-3 text-cyan-400" />

        <span>
          Recommendations use process measurements, trajectory evidence and
          simulation results.
        </span>

      </div>

    </div>
  );
};