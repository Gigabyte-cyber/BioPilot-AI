import React from 'react';
import {
  Award,
  CheckCircle2,
  ShieldAlert,
  Wrench,
  Zap,
} from 'lucide-react';

import { CandidateIntervention } from '../types/bioprocess';

interface InterventionOptimizerProps {
  candidates: CandidateIntervention[];
  onSelectCandidate: (candidate: CandidateIntervention) => void;
  onOpenApprovalForCandidate: (candidate: CandidateIntervention) => void;
}

export const InterventionOptimizer: React.FC<
  InterventionOptimizerProps
> = ({
  candidates,
  onSelectCandidate,
  onOpenApprovalForCandidate,
}) => {
  const best =
    candidates.find((candidate) => candidate.isBest) ||
    candidates[0];

  const topCandidates = candidates.slice(0, 5);

  if (!best) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4 text-left">
        <div className="text-sm font-bold text-slate-300">
          AI Intervention Optimizer
        </div>

        <p className="text-xs text-slate-500 mt-1">
          No intervention candidates are currently available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              AI Intervention Optimizer
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Compare simulated operating strategies
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-500">
          {candidates.length} strategies evaluated
        </span>
      </div>

      {/* Best intervention */}
      <div className="mt-4 bg-cyan-950/30 border border-cyan-700/60 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-extrabold shrink-0">
              <Award className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Recommended Strategy
                </span>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700">
                  Score {best.compositeScore}
                </span>
              </div>

              <div className="text-sm font-bold text-white mt-1">
                Aeration{' '}
                <span className="text-cyan-400 font-mono">
                  {best.aeration.toFixed(1)} vvm
                </span>

                <span className="text-slate-600 mx-2">+</span>

                Agitation{' '}
                <span className="text-cyan-400 font-mono">
                  {best.agitation} rpm
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {best.rationale}
              </p>
            </div>
          </div>

          {/* Projected outcome */}
          <div className="flex items-center gap-4 bg-slate-950/60 rounded-lg px-3 py-2 shrink-0">
            <div>
              <div className="text-[9px] uppercase text-slate-500 font-bold">
                Projected DO
              </div>

              <div
                className={`text-sm font-bold font-mono ${
                  best.projectedDO < 20
                    ? 'text-rose-400'
                    : 'text-cyan-300'
                }`}
              >
                {best.projectedDO.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase text-slate-500 font-bold">
                O₂ Balance
              </div>

              <div
                className={`text-sm font-bold font-mono ${
                  best.oxygenBalance < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {best.oxygenBalance > 0 ? '+' : ''}
                {best.oxygenBalance.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-cyan-900/40">
          <button
            onClick={() => onSelectCandidate(best)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Test in Sandbox
          </button>

          <button
            onClick={() => onOpenApprovalForCandidate(best)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Review & Approve
          </button>
        </div>
      </div>

      {/* Candidate comparison */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Strategy Comparison
          </span>

          <span className="text-[10px] text-slate-600">
            Top {topCandidates.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-bold tracking-wider">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Aeration</th>
                <th className="py-2 pr-3">Agitation</th>
                <th className="py-2 pr-3">Projected DO</th>
                <th className="py-2 pr-3">O₂ Balance</th>
                <th className="py-2 pr-3">Risk</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {topCandidates.map((candidate) => {
                const isBest = candidate.isBest;

                return (
                  <tr
                    key={`${candidate.rank}-${candidate.aeration}-${candidate.agitation}`}
                    className={`transition ${
                      isBest
                        ? 'bg-cyan-950/20'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-2.5 pr-3">
                      <span
                        className={`font-mono font-bold ${
                          candidate.rank === 1
                            ? 'text-cyan-300'
                            : 'text-slate-500'
                        }`}
                      >
                        #{candidate.rank}
                      </span>
                    </td>

                    <td className="py-2.5 pr-3 font-mono text-slate-300">
                      {candidate.aeration.toFixed(1)} vvm
                    </td>

                    <td className="py-2.5 pr-3 font-mono text-slate-300">
                      {candidate.agitation} rpm
                    </td>

                    <td className="py-2.5 pr-3 font-mono">
                      <span
                        className={
                          candidate.projectedDO < 20
                            ? 'text-rose-400'
                            : 'text-cyan-300'
                        }
                      >
                        {candidate.projectedDO.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-2.5 pr-3 font-mono">
                      <span
                        className={
                          candidate.oxygenBalance < 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }
                      >
                        {candidate.oxygenBalance > 0 ? '+' : ''}
                        {candidate.oxygenBalance.toFixed(1)}
                      </span>
                    </td>

                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          candidate.risk === 'NORMAL'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : candidate.risk === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {candidate.risk === 'CRITICAL' && (
                          <ShieldAlert className="w-3 h-3" />
                        )}

                        {candidate.risk}
                      </span>
                    </td>

                    <td className="py-2.5 pr-3 font-mono font-bold text-cyan-300">
                      {candidate.compositeScore}
                    </td>

                    <td className="py-2.5 text-right">
                      <button
                        onClick={() =>
                          onSelectCandidate(candidate)
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                      >
                        <Wrench className="w-3 h-3" />
                        Test
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory note */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
        Strategies are evaluated in simulation. No physical equipment is
        controlled by this interface.
      </div>
    </div>
  );
};