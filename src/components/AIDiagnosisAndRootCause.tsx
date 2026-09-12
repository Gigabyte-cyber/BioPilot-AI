import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

import { RiskAssessment, RootCauseAnalysis } from '../types/bioprocess';

interface AIDiagnosisAndRootCauseProps {
  risk: RiskAssessment;
  rootCause: RootCauseAnalysis;
}

export const AIDiagnosisAndRootCause: React.FC<
  AIDiagnosisAndRootCauseProps
> = ({ risk, rootCause }) => {
  const isCritical = risk.overallLevel === 'CRITICAL';
  const isWarning = risk.overallLevel === 'WARNING';

  const getStatusStyle = () => {
    if (isCritical) {
      return 'bg-rose-950 text-rose-300 border-rose-700';
    }

    if (isWarning) {
      return 'bg-amber-950 text-amber-300 border-amber-700';
    }

    return 'bg-emerald-950 text-emerald-300 border-emerald-700';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              AI Diagnosis & Root Cause
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Evidence-based process interpretation
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle()}`}
        >
          {risk.overallLevel}
        </span>
      </div>

      {/* Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
        {/* Process condition */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Process Condition
          </div>

          <div className="flex items-start gap-2">
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}

            <p className="text-sm font-bold text-white leading-relaxed">
              {rootCause.problem}
            </p>
          </div>

          {/* Evidence */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-cyan-400 mb-2">
              <Search className="w-3.5 h-3.5" />
              Evidence
            </div>

            <div className="space-y-1.5">
              {rootCause.evidence.map((evidence, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-slate-900/60 border border-slate-800/80 rounded-md p-2"
                >
                  <span className="text-cyan-400 font-bold">•</span>

                  <span className="text-xs text-slate-300 leading-relaxed">
                    {evidence}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Root cause */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            Likely Root Cause
          </div>

          <p className="text-sm font-semibold text-slate-200 leading-relaxed">
            {rootCause.likelyContributingFactor}
          </p>

          {/* Alternatives */}
          {rootCause.alternativePossibilities.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
                Other Possible Factors
              </div>

              <div className="space-y-1">
                {rootCause.alternativePossibilities.map(
                  (alternative, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <span className="text-slate-600 mt-0.5">•</span>
                      <span>{alternative}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engineering response */}
      <div className="mt-3 bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-cyan-400 mb-1.5">
          <Wrench className="w-3.5 h-3.5" />
          Recommended Response
        </div>

        <p className="text-xs text-slate-200 leading-relaxed">
          {rootCause.engineeringResponse}
        </p>
      </div>

      {/* Method note */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />

        <span>
          Diagnosis combines process thresholds, trajectory evidence and
          mechanistic model outputs.
        </span>
      </div>
    </div>
  );
};