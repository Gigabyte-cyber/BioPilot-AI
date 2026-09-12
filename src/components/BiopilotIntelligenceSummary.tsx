import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import {
  CandidateIntervention,
  FermentationPhase,
  RiskAssessment,
  TrajectoryMetrics,
} from '../types/bioprocess';

interface BiopilotIntelligenceSummaryProps {
  phase?: FermentationPhase;
  currentPhase?: FermentationPhase;

  risk?: RiskAssessment;
  riskLevel?: string;

  primaryConcern?: string;
  recommendation?: string;

  trajectories?: TrajectoryMetrics;

  bestIntervention?: CandidateIntervention | null;

  onOpenApprovalModal?: () => void;
  onAuthorizeClick?: () => void;

  isHumanApproved: boolean;

  oxygenBalance?: number;
}

export const BiopilotIntelligenceSummary: React.FC<
  BiopilotIntelligenceSummaryProps
> = ({
  phase,
  currentPhase,
  risk,
  riskLevel,
  primaryConcern,
  recommendation,
  trajectories,
  bestIntervention,
  onOpenApprovalModal,
  onAuthorizeClick,
  isHumanApproved,
  oxygenBalance,
}) => {
  /* ============================================================
     CORE PROCESS STATE
  ============================================================ */

  const activePhase =
    phase ?? currentPhase ?? 'Exponential Growth';

  const overallRisk =
    risk?.overallLevel ?? riskLevel ?? 'NORMAL';

  const isCritical = overallRisk === 'CRITICAL';
  const isWarning = overallRisk === 'WARNING';

  const concern =
    risk?.primaryConcern ??
    primaryConcern ??
    'Nominal aerobic state';


  /* ============================================================
     TRAJECTORY
  ============================================================ */

  const doRate = trajectories?.do?.rate ?? 0;

  const trajectory =
    doRate < -5
      ? 'Rapidly declining'
      : doRate < -1
      ? 'Declining'
      : doRate > 2
      ? 'Recovering'
      : 'Stable';


  /* ============================================================
     AI RECOMMENDATION
  ============================================================ */

  const actionText =
    recommendation ||
    (isCritical || isWarning
      ? bestIntervention
        ? `Increase aeration to ${bestIntervention.aeration} vvm and agitation to ${bestIntervention.agitation} rpm`
        : 'Evaluate oxygen transfer conditions'
      : 'Maintain current operating strategy');


  /* ============================================================
     PROJECTED RESPONSE
  ============================================================ */

  const currentOxygenBalance =
    oxygenBalance ??
    risk?.parameters?.find(
      (p) => p.parameter.includes('Oxygen Balance')
    )?.value ??
    0;

  const projectedDO =
    bestIntervention?.projectedDO ?? null;

  const projectedBalance =
    bestIntervention?.oxygenBalance ?? null;

  const balanceDelta =
    projectedBalance !== null
      ? projectedBalance - currentOxygenBalance
      : null;


  /* ============================================================
     HUMAN GOVERNANCE
  ============================================================ */

  const handleApproval =
    onOpenApprovalModal ??
    onAuthorizeClick ??
    (() => {});


  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-xl mb-4 relative overflow-hidden">

      {/* Subtle status glow */}
      <div
        className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-15 ${
          isCritical
            ? 'bg-rose-600'
            : isWarning
            ? 'bg-amber-500'
            : 'bg-cyan-500'
        }`}
      />


      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800/80">

        <div className="flex items-center gap-2">

          <Sparkles className="w-4 h-4 text-cyan-400" />

          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">
            BioPilot Intelligence
          </h2>

        </div>

        <div className="hidden sm:block text-[10px] text-slate-500">
          Process reasoning & decision support
        </div>

      </div>


      {/* ========================================================
          INTELLIGENCE GRID
      ======================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">


        {/* ======================================================
            1. PHASE
        ====================================================== */}

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Process Phase
          </div>

          <div
            className="text-sm font-extrabold text-white mt-1 truncate"
            title={activePhase}
          >
            {activePhase}
          </div>

          <div className="text-[10px] text-slate-500 mt-1">
            Current biological state
          </div>

        </div>


        {/* ======================================================
            2. RISK
        ====================================================== */}

        <div
          className={`p-3 rounded-lg border ${
            isCritical
              ? 'bg-rose-950/40 border-rose-800/80'
              : isWarning
              ? 'bg-amber-950/40 border-amber-800/80'
              : 'bg-emerald-950/40 border-emerald-800/80'
          }`}
        >

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Process Risk
          </div>

          <div className="flex items-center gap-2 mt-1">

            {isCritical ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : isWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}

            <span
              className={`text-sm font-extrabold ${
                isCritical
                  ? 'text-rose-300'
                  : isWarning
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {overallRisk}
            </span>

          </div>

          <div className="text-[10px] text-slate-500 mt-1">
            Current process condition
          </div>

        </div>


        {/* ======================================================
            3. DIAGNOSIS
        ====================================================== */}

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Diagnosis
          </div>

          <div
            className="text-sm font-extrabold text-slate-200 mt-1 truncate"
            title={concern}
          >
            {concern}
          </div>

          <div className="flex items-center gap-1 mt-1">

            {doRate < -1 ? (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            ) : (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            )}

            <span className="text-[10px] text-slate-500">
              DO trajectory: {trajectory}
            </span>

          </div>

        </div>


        {/* ======================================================
            4. AI RECOMMENDATION
        ====================================================== */}

        <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-800/60">

          <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
            AI Recommendation
          </div>

          <div
            className="text-[11px] font-semibold text-slate-200 mt-1 leading-relaxed line-clamp-3"
            title={actionText}
          >
            {actionText}
          </div>

        </div>


        {/* ======================================================
            5. DECISION / GOVERNANCE
        ====================================================== */}

        <div
          className={`p-3 rounded-lg border flex flex-col justify-between ${
            isHumanApproved
              ? 'bg-emerald-950/40 border-emerald-700/70'
              : isCritical || isWarning
              ? 'bg-amber-950/40 border-amber-700/70'
              : 'bg-slate-950/60 border-slate-800/80'
          }`}
        >

          <div>

            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Decision Gate
            </div>

            <div
              className={`text-sm font-extrabold mt-1 ${
                isHumanApproved
                  ? 'text-emerald-300'
                  : isCritical || isWarning
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              {isHumanApproved
                ? 'Approved'
                : isCritical || isWarning
                ? 'Review Required'
                : 'No Action Required'}
            </div>

            {projectedDO !== null && (
              <div className="text-[10px] text-slate-400 mt-1">
                Projected DO: {projectedDO.toFixed(1)}%
              </div>
            )}

            {balanceDelta !== null && (
              <div className="text-[10px] text-slate-500">
                O₂ balance Δ: {balanceDelta >= 0 ? '+' : ''}
                {balanceDelta.toFixed(1)}
              </div>
            )}

          </div>


          {(isCritical || isWarning) && (
            <button
              onClick={handleApproval}
              className={`mt-2 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all ${
                isHumanApproved
                  ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isHumanApproved
                ? 'Approved'
                : 'Review & Approve'}
            </button>
          )}

        </div>

      </div>

    </section>
  );
};