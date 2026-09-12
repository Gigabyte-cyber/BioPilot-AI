import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CandidateIntervention, RiskAssessment } from '../types/bioprocess';

interface HumanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  bestIntervention: CandidateIntervention | null;
  risk: RiskAssessment;
  simulationTime: number;
  onApprove: (engineerName: string, notes: string) => void;
  isAlreadyApproved: boolean;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  isOpen,
  onClose,
  bestIntervention,
  risk,
  simulationTime,
  onApprove,
  isAlreadyApproved,
}) => {
  const [engineerName, setEngineerName] = useState(
    'Lead Bioprocess Engineer'
  );

  const [engineerNotes, setEngineerNotes] = useState(
    'Reviewed the simulated process trajectory and intervention results.'
  );

  const [checkBalance, setCheckBalance] = useState(true);
  const [checkLimits, setCheckLimits] = useState(true);
  const [checkDecision, setCheckDecision] = useState(true);

  if (!isOpen) return null;

  const canApprove =
    checkBalance &&
    checkLimits &&
    checkDecision &&
    engineerName.trim().length > 3;

  const handleApprove = () => {
    if (!canApprove || isAlreadyApproved) return;

    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.6 },
    });

    onApprove(engineerName.trim(), engineerNotes.trim());
    onClose();
  };

  const projectedDO = bestIntervention?.projectedDO ?? 0;
  const oxygenBalance = bestIntervention?.oxygenBalance ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-left">
        
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                Human Review & Approval
              </h3>

              <p className="text-[11px] text-slate-400">
                Final engineering decision before applying the strategy in simulation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Simulation-only notice */}
          <div className="bg-cyan-950/30 border border-cyan-800/60 p-3 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />

            <div className="text-xs text-cyan-100/90 leading-relaxed">
              <strong>HUMAN-IN-THE-LOOP:</strong>{' '}
              BioPilot AI provides a simulated recommendation.
              The engineer reviews the evidence and decides whether to
              approve the proposed strategy. No physical equipment is
              controlled by this interface.
            </div>
          </div>

          {/* Proposed intervention */}
          {bestIntervention ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Proposed Strategy
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    Simulation time: {simulationTime.toFixed(1)} h
                  </div>
                </div>

                {isAlreadyApproved && (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">
                    Aeration
                  </div>

                  <div className="text-sm font-bold text-cyan-300 mt-1">
                    {bestIntervention.aeration.toFixed(2)} vvm
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">
                    Agitation
                  </div>

                  <div className="text-sm font-bold text-cyan-300 mt-1">
                    {bestIntervention.agitation.toFixed(0)} rpm
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">
                    Projected DO
                  </div>

                  <div
                    className={`text-sm font-bold mt-1 ${
                      projectedDO >= 30
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {projectedDO.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">
                    O₂ Balance
                  </div>

                  <div
                    className={`text-sm font-bold mt-1 ${
                      oxygenBalance >= 0
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {oxygenBalance >= 0 ? '+' : ''}
                    {oxygenBalance.toFixed(2)}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic bg-slate-950 border border-slate-800 rounded-lg p-3">
              No intervention is currently available for approval.
            </div>
          )}

          {/* Review checklist */}
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Engineering Review
              </div>

              <div className="text-[11px] text-slate-500 mt-1">
                Confirm the simulated evidence before approving the strategy.
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checkBalance}
                onChange={(e) => setCheckBalance(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 mt-0.5"
              />

              <span>
                I reviewed the simulated oxygen balance and DO response.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checkLimits}
                onChange={(e) => setCheckLimits(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 mt-0.5"
              />

              <span>
                I reviewed the simulated aeration and agitation values
                against the configured process limits.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checkDecision}
                onChange={(e) => setCheckDecision(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 mt-0.5"
              />

              <span>
                I understand that this approval applies to the simulation
                and decision record only.
              </span>
            </label>
          </div>

          {/* Engineer details */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Reviewer
              </label>

              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="Enter reviewer name"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Review Notes
              </label>

              <textarea
                value={engineerNotes}
                onChange={(e) => setEngineerNotes(e.target.value)}
                rows={2}
                placeholder="Add a short engineering justification..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
          
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleApprove}
            disabled={!canApprove || isAlreadyApproved || !bestIntervention}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />

            {isAlreadyApproved
              ? 'Simulation Approved'
              : 'Approve Simulated Strategy'}
          </button>
        </div>
      </div>
    </div>
  );
};