import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Zap,
} from 'lucide-react';

import { ProcessPoint, RiskAssessment } from '../types/bioprocess';
import { LiveRiskEvent, ProductProfile } from '../types/product';

interface LiveSimulationRiskBannerProps {
  current: ProcessPoint;
  risk: RiskAssessment;
  product: ProductProfile;
  isRunning: boolean;
  batchHours: number;
  liveRiskEvents: LiveRiskEvent[];

  onQuickMitigate: () => void;
  onOpenInterventionModal: () => void;
}

export const LiveSimulationRiskBanner: React.FC<
  LiveSimulationRiskBannerProps
> = ({
  current,
  risk,
  product,
  isRunning,
  batchHours,
  liveRiskEvents,
  onQuickMitigate,
  onOpenInterventionModal,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const isCritical = risk.overallLevel === 'CRITICAL';
  const isWarning = risk.overallLevel === 'WARNING';
  const isEndpoint = risk.overallLevel === 'ENDPOINT';
  const isStable = risk.overallLevel === 'NORMAL';

  const topFlaggedParam =
    risk.parameters.find((parameter) => parameter.level === 'CRITICAL') ||
    risk.parameters.find((parameter) => parameter.level === 'WARNING');

  const getContainerStyle = () => {
    if (isCritical) {
      return 'bg-rose-950/40 border-rose-600/70';
    }

    if (isWarning) {
      return 'bg-amber-950/30 border-amber-600/60';
    }

    if (isEndpoint) {
      return 'bg-blue-950/30 border-blue-600/60';
    }

    return 'bg-slate-900/90 border-emerald-800/40';
  };

  const getIconStyle = () => {
    if (isCritical) {
      return 'bg-rose-500/20 border-rose-500/50 text-rose-400';
    }

    if (isWarning) {
      return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    }

    if (isEndpoint) {
      return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }

    return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
  };

  const getLevelStyle = () => {
    if (isCritical) {
      return 'bg-rose-500/20 border-rose-500/50 text-rose-300';
    }

    if (isWarning) {
      return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
    }

    if (isEndpoint) {
      return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
    }

    return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
  };

  return (
    <div className="mb-4 text-left">
      <div
        className={`rounded-2xl border p-4 shadow-xl transition-all duration-300 ${getContainerStyle()}`}
      >
        {/* Status header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Status icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getIconStyle()}`}
            >
              {isCritical ? (
                <ShieldAlert className="w-5 h-5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isEndpoint ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            {/* Status information */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${getLevelStyle()}`}
                >
                  {risk.overallLevel}
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Hour{' '}
                  <strong className="text-white">
                    {current.time.toFixed(1)}
                  </strong>{' '}
                  / {batchHours.toFixed(1)} h
                </span>

                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/50">
                  {product.shortName}
                </span>

                {isRunning && (
                  <span className="text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    SIMULATION RUNNING
                  </span>
                )}
              </div>

              {/* Main diagnosis */}
              <div className="mt-2">
                {topFlaggedParam ? (
                  <p className="text-sm font-semibold text-slate-100">
                    <span
                      className={
                        isCritical
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }
                    >
                      {topFlaggedParam.parameter}:
                    </span>{' '}
                    <span className="text-slate-300">
                      {topFlaggedParam.reason}
                    </span>
                  </p>
                ) : isEndpoint ? (
                  <p className="text-sm font-semibold text-blue-200">
                    Simulation reached the configured batch endpoint.
                  </p>
                ) : isStable ? (
                  <p className="text-sm font-medium text-emerald-300">
                    Process is operating within the current safety envelope.
                  </p>
                ) : (
                  <p className="text-sm font-medium text-slate-300">
                    Process state is being monitored.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {(isCritical || isWarning) && (
              <button
                onClick={onQuickMitigate}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition flex items-center gap-1.5"
                title="Simulate an intervention to improve the process state"
              >
                <Zap className="w-3.5 h-3.5" />
                Simulate Mitigation
              </button>
            )}

            <button
              onClick={onOpenInterventionModal}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              Intervention Lab
            </button>

            <button
              onClick={() => setShowHistory((previous) => !previous)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 transition"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />

              Risk Log
              <span className="text-slate-500">
                ({liveRiskEvents.length})
              </span>

              {showHistory ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Risk history */}
        {showHistory && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Risk Detection History
              </span>

              <span className="text-[10px] font-mono text-slate-500">
                {liveRiskEvents.length} event
                {liveRiskEvents.length === 1 ? '' : 's'}
              </span>
            </div>

            {liveRiskEvents.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 bg-slate-950/50 rounded-lg">
                No risk events detected during the current simulation.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {liveRiskEvents
                  .slice(-8)
                  .reverse()
                  .map((event) => {
                    const critical = event.level === 'CRITICAL';

                    return (
                      <div
                        key={event.id}
                        className={`p-2.5 rounded-lg border ${
                          critical
                            ? 'bg-rose-950/30 border-rose-900/60'
                            : 'bg-amber-950/30 border-amber-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              {event.parameter}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                critical
                                  ? 'bg-rose-900/80 text-rose-300'
                                  : 'bg-amber-900/80 text-amber-300'
                              }`}
                            >
                              {event.level}
                            </span>

                            <span className="text-[10px] font-mono text-slate-500">
                              {event.timeHour.toFixed(1)} h
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-600 shrink-0">
                            {event.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-1">
                          {event.physicalCause}
                        </p>

                        <p className="text-[10px] text-cyan-400 mt-1">
                          Recommendation: {event.remedy}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};