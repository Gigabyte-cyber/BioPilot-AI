import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Lightbulb,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { AgentStep } from '../types/bioprocess';

interface AgentWorkflowPipelineProps {
  agents: AgentStep[];
  onTriggerApprovalModal: () => void;
  isHumanApproved: boolean;
}

export const AgentWorkflowPipeline: React.FC<AgentWorkflowPipelineProps> = ({
  agents,
  onTriggerApprovalModal,
  isHumanApproved,
}) => {
  const getIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Activity className="w-4 h-4" />;
      case 2:
        return <AlertTriangle className="w-4 h-4" />;
      case 3:
        return <Search className="w-4 h-4" />;
      case 4:
        return <FlaskConical className="w-4 h-4" />;
      case 5:
        return <SlidersHorizontal className="w-4 h-4" />;
      case 6:
        return <Lightbulb className="w-4 h-4" />;
      case 7:
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getStageName = (agent: AgentStep, id: number) => {
    const names = [
      'Monitor',
      'Detect',
      'Diagnose',
      'Simulate',
      'Optimize',
      'Recommend',
      'Human Approval',
    ];

    return names[id - 1] ?? agent.name;
  };

  const getStatus = (
    status: AgentStep['status'],
    isHumanGate: boolean
  ) => {
    if (isHumanGate && isHumanApproved) {
      return {
        label: 'Approved',
        className:
          'bg-emerald-950/70 text-emerald-300 border-emerald-800',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }

    if (status === 'alert') {
      return {
        label: 'Review',
        className:
          'bg-amber-950/70 text-amber-300 border-amber-800',
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    }

    if (status === 'completed') {
      return {
        label: 'Complete',
        className:
          'bg-emerald-950/50 text-emerald-300 border-emerald-900',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }

    return {
      label: 'Standby',
      className:
        'bg-slate-800 text-slate-400 border-slate-700',
      icon: null,
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4 text-left">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />

            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              BioPilot AI Workflow
            </h3>
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            From process monitoring to explainable engineering decisions
          </p>
        </div>

        <div className="text-[10px] font-mono text-slate-500">
          MONITOR → DETECT → DIAGNOSE → SIMULATE → OPTIMIZE → RECOMMEND → HUMAN
        </div>
      </div>

      {/* Pipeline */}
      <div className="mt-4 flex flex-col lg:flex-row lg:items-stretch gap-2">

        {agents.slice(0, 7).map((agent, index) => {
          const stageId = index + 1;
          const isHumanGate = stageId === 7;
          const status = getStatus(agent.status, isHumanGate);

          return (
            <React.Fragment key={agent.id}>

              <div
                className={`flex-1 rounded-lg border p-3 transition-all ${
                  isHumanGate
                    ? isHumanApproved
                      ? 'bg-emerald-950/30 border-emerald-700'
                      : 'bg-amber-950/30 border-amber-700'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >

                {/* Stage heading */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        isHumanGate
                          ? isHumanApproved
                            ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                            : 'bg-amber-950 border-amber-800 text-amber-400'
                          : 'bg-slate-900 border-slate-700 text-cyan-400'
                      }`}
                    >
                      {getIcon(stageId)}
                    </div>

                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        Step {stageId}
                      </div>

                      <div className="text-xs font-bold text-slate-100">
                        {getStageName(agent, stageId)}
                      </div>
                    </div>

                  </div>

                  <span
                    className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 leading-relaxed mt-3">
                  {agent.summary}
                </p>

                {/* Evidence */}
                {agent.evidence && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">
                      Evidence
                    </div>

                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {agent.evidence}
                    </div>
                  </div>
                )}

                {/* Human approval */}
                {isHumanGate && (
                  <button
                    onClick={onTriggerApprovalModal}
                    className={`w-full mt-3 py-1.5 rounded-md text-[10px] font-bold transition-colors ${
                      isHumanApproved
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {isHumanApproved
                      ? 'View Approval'
                      : 'Review & Approve'}
                  </button>
                )}
              </div>

              {/* Connector */}
              {stageId < Math.min(agents.length, 7) && (
                <div className="hidden lg:flex items-center text-slate-700">
                  <span className="text-lg">→</span>
                </div>
              )}

            </React.Fragment>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />

          <span>
            Human-in-the-loop decision support
          </span>
        </div>

        <div className="text-[9px] text-slate-500">
          Simulation-based • No physical equipment control
        </div>
      </div>
    </div>
  );
};