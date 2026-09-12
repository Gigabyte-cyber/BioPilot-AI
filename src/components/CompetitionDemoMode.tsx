import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  FileCheck,
  Lock,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { ProcessPoint } from '../types/bioprocess';

interface CompetitionDemoModeProps {
  current: ProcessPoint;
  onSetSimulationState: (time: number, aeration: number, agitation: number) => void;
  onTriggerApprovalModal: () => void;
  isHumanApproved: boolean;
}

interface DemoMilestone {
  step: number;
  timeLabel: string;
  simHour: number;
  title: string;
  narrative: string;
  aiState: string;
  aeration: number;
  agitation: number;
  riskBadge: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

const DEMO_STEPS: DemoMilestone[] = [
  {
    step: 1,
    timeLabel: '00:00',
    simHour: 0.5,
    title: 'Fermentation Inoculation & Healthy Equilibrium',
    narrative:
      'The virtual bioreactor is seeded at low biomass (X = 0.4 g/L). Volumetric transfer capacity (OTR) comfortably exceeds metabolic oxygen demand (OUR). Oxygen balance is strongly positive.',
    aiState: 'Process Monitor: Passive surveillance. All 12 parameters nominal.',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'NORMAL',
  },
  {
    step: 2,
    timeLabel: '02:30',
    simHour: 2.8,
    title: 'Exponential Cell Division & Surging Respiration',
    narrative:
      'Biomass reaches 1.8 g/L following Monod kinetics. Cellular respiration increases exponentially as glucose is consumed at high specific growth rate (μ = 0.45 h⁻¹).',
    aiState: 'Phase Analyst: Confirmed Exponential Growth. DO stable at 65%.',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'NORMAL',
  },
  {
    step: 3,
    timeLabel: '03:40',
    simHour: 4.2,
    title: 'Oxygen Balance Deterioration Detected',
    narrative:
      'Cell density surpasses 2.8 g/L. Cellular oxygen demand (OUR) matches volumetric oxygen transfer rate (OTR). Oxygen balance crosses into negative territory (-1.4 mmol/L/h).',
    aiState: 'Risk Analyst: Early warning triggered. Trajectory engine detects negative dDO/dt.',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'WARNING',
  },
  {
    step: 4,
    timeLabel: '05:50',
    simHour: 5.9,
    title: 'Critical Oxygen Limitation & Hypoxia Threat',
    narrative:
      'Massive metabolic turnover drives DO down to 14.8%, breaching the critical 15% Pasteur threshold. Broth oxygen balance reaches severe deficit (-7.2 mmol/L/h). Cell stress imminent.',
    aiState: 'Root Cause Analyst: Identified gas-liquid mass transfer bottleneck under baseline sparging.',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'CRITICAL',
  },
  {
    step: 5,
    timeLabel: '06:00',
    simHour: 5.9,
    title: 'In Silico Intervention Simulation Initiated',
    narrative:
      'Rather than making unverified changes to physical equipment, the AI launches the virtual bioreactor sandbox to project forward trajectories 2.5 hours ahead.',
    aiState: 'Intervention Simulator: Evaluated differential equations across 25 parameter permutations.',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'CRITICAL',
  },
  {
    step: 6,
    timeLabel: '06:05',
    simHour: 5.9,
    title: 'Optimizer Ranks Top Operating Candidates',
    narrative:
      'Intervention Optimizer ranks candidates balancing DO recovery, positive oxygen balance, cell shear stress penalty, and energy consumption. Candidate #1 (2.0 vvm, 350 rpm) emerges superior.',
    aiState: 'Optimizer: Identified best candidate yielding +28.4% DO and +5.8 mmol/L/h balance recovery.',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'CRITICAL',
  },
  {
    step: 7,
    timeLabel: '06:07',
    simHour: 5.9,
    title: 'Explainable AI Evidence Justification',
    narrative:
      'Explainability Agent verifies 5 independent evidence indicators: DO level, balance deficit, rate trajectory, growth vigor, and simulated forward recovery.',
    aiState: 'Explainability Agent: Decision confidence rated "High Evidence" (5/5 indicators satisfied).',
    aeration: 1.0,
    agitation: 250,
    riskBadge: 'WARNING',
  },
  {
    step: 8,
    timeLabel: '06:10',
    simHour: 5.9,
    title: 'Human-in-the-Loop Review & Setpoint Execution',
    narrative:
      'Mandatory Human Review Gate halts automated actuation. The lead bioprocess engineer reviews evidence, confirms impeller shear limits, and authorizes setpoint execution.',
    aiState: 'Human Review Gate: Awaiting engineer signature or signed in audit trail.',
    aeration: 2.0,
    agitation: 350,
    riskBadge: 'NORMAL',
  },
];

export const CompetitionDemoMode: React.FC<CompetitionDemoModeProps> = ({
  current,
  onSetSimulationState,
  onTriggerApprovalModal,
  isHumanApproved,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(3); // default to interesting step 4
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const activeStep = DEMO_STEPS[activeStepIndex];

  // Auto-play timer for presentation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= DEMO_STEPS.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          const next = prev + 1;
          const s = DEMO_STEPS[next];
          onSetSimulationState(s.simHour, s.aeration, s.agitation);
          return next;
        });
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, onSetSimulationState]);

  const handleSelectStep = (idx: number) => {
    setActiveStepIndex(idx);
    const s = DEMO_STEPS[idx];
    onSetSimulationState(s.simHour, s.aeration, s.agitation);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl mb-4 text-left">
      {/* Competition Presentation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              Competition Live Demo Mode
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                Engineering Day 3–5 Min Scenario
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Structured 8-milestone walkthrough illustrating early detection, virtual sandbox simulation, and human verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md ${
              isAutoPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoPlaying ? 'Pause Auto Demo' : 'Start Auto Demo'}
          </button>
          <button
            onClick={() => handleSelectStep(0)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Reset to step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Navigator Bar */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-4">
        {DEMO_STEPS.map((s, idx) => (
          <button
            key={s.step}
            onClick={() => handleSelectStep(idx)}
            className={`p-2 rounded-lg border text-left transition-all ${
              idx === activeStepIndex
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span>#{s.step}</span>
              <span className="text-slate-500">{s.timeLabel}</span>
            </div>
            <div className="text-[11px] font-bold truncate mt-1">{s.title.split(' ')[0]} {s.title.split(' ')[1]}</div>
          </button>
        ))}
      </div>

      {/* Active Milestone Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              EVENT {activeStep.timeLabel}
            </span>
            <h4 className="text-base sm:text-lg font-extrabold text-white">
              {activeStep.title}
            </h4>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
              activeStep.riskBadge === 'CRITICAL'
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : activeStep.riskBadge === 'WARNING'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}
          >
            Status: {activeStep.riskBadge} RISK
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          {activeStep.narrative}
        </p>

        {/* AI Action Status Banner for this step */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-200 font-medium">
              <strong className="text-cyan-300 uppercase text-[11px] mr-1">Agent Reasoner:</strong>
              {activeStep.aiState}
            </span>
          </div>

          {activeStep.step === 8 && (
            <button
              onClick={onTriggerApprovalModal}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                isHumanApproved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              }`}
            >
              {isHumanApproved ? 'Signed (Audit Sealed)' : 'Sign Engineer Approval'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Controls between demo steps */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <button
          onClick={() => handleSelectStep(Math.max(0, activeStepIndex - 1))}
          disabled={activeStepIndex === 0}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-semibold"
        >
          ← Previous Milestone
        </button>
        <span className="text-slate-400 font-mono text-[11px]">
          Step {activeStepIndex + 1} of {DEMO_STEPS.length}
        </span>
        <button
          onClick={() => handleSelectStep(Math.min(DEMO_STEPS.length - 1, activeStepIndex + 1))}
          disabled={activeStepIndex === DEMO_STEPS.length - 1}
          className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex items-center gap-1"
        >
          Next Milestone →
        </button>
      </div>

      {/* Core Project Takeaway Banner */}
      <div className="mt-4 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
        <p className="text-xs font-bold text-slate-200 tracking-wide">
          BIOPILOT AI CORE PRINCIPLE:{' '}
          <span className="text-cyan-400">Detect earlier</span> •{' '}
          <span className="text-cyan-400">Reason scientifically</span> •{' '}
          <span className="text-cyan-400">Simulate safely</span> •{' '}
          <span className="text-cyan-400">Optimize intelligently</span> •{' '}
          <span className="text-emerald-400">Keep humans in control</span>.
        </p>
      </div>
    </div>
  );
};
