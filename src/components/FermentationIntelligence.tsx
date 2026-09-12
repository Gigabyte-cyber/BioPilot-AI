import React from 'react';
import {
  Activity,
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

import {
  PhaseAnalysis,
  ProcessPoint,
  TrajectoryMetrics,
} from '../types/bioprocess';

interface FermentationIntelligenceProps {
  current: ProcessPoint;
  phaseAnalysis: PhaseAnalysis;
  trajectories: TrajectoryMetrics;
}

export const FermentationIntelligence: React.FC<
  FermentationIntelligenceProps
> = ({
  current,
  phaseAnalysis,
  trajectories,
}) => {

  /* ============================================================
     TREND BADGE
  ============================================================ */

  const getTrendBadge = (trend: string) => {
    switch (trend) {

      case 'RAPIDLY INCREASING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
            <ArrowUp className="w-3 h-3" />
            Rapidly Increasing
          </span>
        );

      case 'INCREASING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            <ArrowUpRight className="w-3 h-3" />
            Increasing
          </span>
        );

      case 'RAPIDLY DECREASING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/60">
            <ArrowDown className="w-3 h-3" />
            Rapidly Decreasing
          </span>
        );

      case 'DECREASING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
            <ArrowDownRight className="w-3 h-3" />
            Decreasing
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <ArrowRight className="w-3 h-3" />
            Stable
          </span>
        );
    }
  };


  /* ============================================================
     KEY TRAJECTORIES
  ============================================================ */

  const trajectoryItems = [
    {
      id: 'biomass',
      name: 'Biomass',
      value: `${current.biomass.toFixed(2)} g/L`,
      trajectory: trajectories.biomass,
    },
    {
      id: 'substrate',
      name: 'Substrate',
      value: `${current.substrate.toFixed(2)} g/L`,
      trajectory: trajectories.substrate,
    },
    {
      id: 'product',
      name: 'Product',
      value: `${current.product.toFixed(2)} g/L`,
      trajectory: trajectories.product,
    },
    {
      id: 'do',
      name: 'Dissolved Oxygen',
      value: `${current.do.toFixed(1)} %`,
      trajectory: trajectories.do,
    },
    {
      id: 'growth',
      name: 'Growth Rate',
      value: `${current.specificGrowthRate.toFixed(3)} h⁻¹`,
      trajectory: trajectories.growthRate,
    },
  ];


  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-800 mb-4">

        <div className="flex items-center gap-2">

          <Activity className="w-4 h-4 text-cyan-400" />

          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Fermentation Intelligence
          </h3>

        </div>

        <div className="flex items-center gap-2">

          <span className="text-[10px] text-slate-500">
            Phase confidence
          </span>

          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            {phaseAnalysis.confidence}
          </span>

        </div>

      </div>


      {/* ========================================================
          PHASE + REASONING
      ======================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* PHASE */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Current Phase
          </div>

          <div className="flex items-center gap-2 mt-1.5">

            <Sparkles className="w-4 h-4 text-cyan-400" />

            <span className="text-base font-black text-cyan-300">
              {phaseAnalysis.currentPhase}
            </span>

          </div>

          <div className="text-[10px] text-slate-500 mt-2">
            Classified from current process state and trajectory.
          </div>

        </div>


        {/* REASONING */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-lg p-3">

          <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-1.5">
            Why BioPilot Classified This Phase
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {phaseAnalysis.reasoning}
          </p>

        </div>

      </div>


      {/* ========================================================
          SUPPORTING INDICATORS
      ======================================================== */}

      {phaseAnalysis.indicators?.length > 0 && (
        <div className="mb-4">

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
            Phase Indicators
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

            {phaseAnalysis.indicators.slice(0, 4).map((indicator, index) => (

              <div
                key={index}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5"
              >

                <div className="flex items-center gap-1.5">

                  <CheckCircle className="w-3 h-3 text-emerald-400" />

                  <span className="text-[10px] text-slate-400">
                    {indicator.label}
                  </span>

                </div>

                <div className="text-xs font-bold text-slate-200 mt-1 font-mono">
                  {indicator.value}
                </div>

              </div>

            ))}

          </div>

        </div>
      )}


      {/* ========================================================
          PROCESS TRAJECTORIES
      ======================================================== */}

      <div>

        <div className="flex items-center justify-between mb-2">

          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Process Trajectories
          </div>

          <div className="text-[10px] text-slate-600">
            Current state + direction
          </div>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs">

            <thead>

              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-bold tracking-wider">

                <th className="pb-2">
                  Parameter
                </th>

                <th className="pb-2">
                  Current
                </th>

                <th className="pb-2">
                  Trend
                </th>

                <th className="pb-2">
                  Rate
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-slate-800/50">

              {trajectoryItems.map((item) => (

                <tr
                  key={item.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >

                  <td className="py-2.5 font-semibold text-slate-200">
                    {item.name}
                  </td>

                  <td className="py-2.5 font-mono text-cyan-300">
                    {item.value}
                  </td>

                  <td className="py-2.5">
                    {getTrendBadge(item.trajectory.trend)}
                  </td>

                  <td className="py-2.5 font-mono text-slate-400">
                    {item.trajectory.rateText}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
};