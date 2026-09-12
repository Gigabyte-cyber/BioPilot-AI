import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Flame,
  HelpCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Sparkles,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { CandidateIntervention, ProcessPoint, RiskAssessment, RootCauseAnalysis } from '../types/bioprocess';

interface EngineeringChallengeModeProps {
  current: ProcessPoint;
  risk: RiskAssessment;
  rootCause: RootCauseAnalysis;
  bestIntervention: CandidateIntervention | null;
  onInjectDisturbance: (disturbanceId: string) => void;
  onResetNominal: () => void;
  onTriggerApprovalModal: () => void;
  isHumanApproved: boolean;
}

interface DisturbanceOption {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  severity: 'WARNING' | 'CRITICAL';
}

const DISTURBANCES: DisturbanceOption[] = [
  {
    id: 'oxygen_limitation',
    title: 'Oxygen-Transfer Limitation Bottleneck',
    category: 'Mass Transfer',
    description: 'Surge cellular oxygen demand (OUR) beyond current sparger transfer capacity (OTR), producing acute hypoxic trajectory.',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    severity: 'CRITICAL',
  },
  {
    id: 'low_aeration',
    title: 'Sparger Supply Airflow Drop (-60%)',
    category: 'Pneumatics',
    description: 'Simulate compressor line pressure loss or sub-micron sterile air filter resistance, slashing aeration from 1.0 to 0.4 vvm.',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    severity: 'WARNING',
  },
  {
    id: 'low_agitation',
    title: 'Impeller Variable Frequency Drive Trip',
    category: 'Mechanical',
    description: 'Simulate mechanical drive belt slippage or motor throttle fault, dropping agitation from 250 rpm to 100 rpm.',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    severity: 'CRITICAL',
  },
  {
    id: 'temp_excursion',
    title: 'Thermal Jacket Cooling Water Trip (+3.2°C)',
    category: 'Thermodynamics',
    description: 'Simulate secondary chiller failure causing broth temperature to climb to 40.2°C, initiating thermal enzyme deactivation.',
    icon: <Thermometer className="w-4 h-4 text-rose-400" />,
    severity: 'CRITICAL',
  },
  {
    id: 'ph_acid_drift',
    title: 'Broth pH Organic Acid Accumulation (-0.8 pH)',
    category: 'Biochemistry',
    description: 'Simulate rapid anaerobic overflow metabolism or base titration reservoir exhaustion, driving pH down to 6.20.',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    severity: 'CRITICAL',
  },
  {
    id: 'substrate_starvation',
    title: 'Accelerated Substrate Depletion',
    category: 'Stoichiometry',
    description: 'Simulate premature carbon feed exhaustion (S < 0.35 g/L), triggering batch deceleration and early endpoint dynamics.',
    icon: <AlertOctagon className="w-4 h-4 text-purple-400" />,
    severity: 'WARNING',
  },
];

export const EngineeringChallengeMode: React.FC<EngineeringChallengeModeProps> = ({
  current,
  risk,
  rootCause,
  bestIntervention,
  onInjectDisturbance,
  onResetNominal,
  onTriggerApprovalModal,
  isHumanApproved,
}) => {
  const [activeDisturbanceId, setActiveDisturbanceId] = useState<string | null>('oxygen_limitation');

  const handleSelect = (id: string) => {
    setActiveDisturbanceId(id);
    onInjectDisturbance(id);
  };

  const activeDisturbance = DISTURBANCES.find((d) => d.id === activeDisturbanceId);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl mb-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
              Engineering Challenge Mode (Judge Interactive Testing)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Introduce real-world bioprocess disturbances and watch BioPilot's 9 agents detect, diagnose, and optimize in real time.
          </p>
        </div>

        <button
          onClick={onResetNominal}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset to Nominal State
        </button>
      </div>

      {/* Grid of 6 Injectable Disturbances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {DISTURBANCES.map((d) => {
          const isSelected = d.id === activeDisturbanceId;
          return (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-rose-950/40 border-rose-600 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-800 border border-slate-700">{d.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {d.category}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    d.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {d.severity}
                </span>
              </div>
              <div className="text-xs font-bold text-white mt-1">{d.title}</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">{d.description}</div>
            </button>
          );
        })}
      </div>

      {/* Dynamic AI Closed Loop Response Stream */}
      {activeDisturbance && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            Disturbance Injected: {activeDisturbance.title}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-3">
            {/* Step 1: Detect */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                1. SENSE & DETECT
              </div>
              <div className="text-xs font-bold text-white">{risk.primaryConcern}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                DO: {current.do.toFixed(1)}% • Risk: {risk.overallLevel}
              </div>
            </div>

            {/* Step 2: Diagnose */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                2. ROOT CAUSE
              </div>
              <div className="text-xs font-bold text-white">{rootCause.problem}</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate" title={rootCause.likelyContributingFactor}>
                {rootCause.likelyContributingFactor}
              </div>
            </div>

            {/* Step 3: Simulate & Optimize */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                3. SIMULATE & OPTIMIZE
              </div>
              {bestIntervention ? (
                <>
                  <div className="text-xs font-bold text-white">
                    Aeration: {bestIntervention.aeration} vvm • Agitation: {bestIntervention.agitation} rpm
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">
                    Projected DO: +{(bestIntervention.projectedDO ?? 0).toFixed(1)}% (Score: {bestIntervention.compositeScore})
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Evaluating candidates...</div>
              )}
            </div>

            {/* Step 4: Human Gate */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                  4. HUMAN APPROVAL
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {isHumanApproved ? 'Operator Signed' : 'Approval Required'}
                </div>
              </div>
              <button
                onClick={onTriggerApprovalModal}
                className={`mt-2 text-xs font-bold px-2.5 py-1 rounded transition-all ${
                  isHumanApproved
                    ? 'bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                }`}
              >
                {isHumanApproved ? 'Signed (Audit View)' : 'Review & Authorize'}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="font-bold text-cyan-300">Engineering Interpretation: </span>
            {rootCause.engineeringResponse}
          </div>
        </div>
      )}
    </div>
  );
};
