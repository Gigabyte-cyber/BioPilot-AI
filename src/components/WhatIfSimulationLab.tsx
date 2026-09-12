import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  BioreactorType,
  InterventionScenario,
  ProcessPoint,
} from '../types/bioprocess';
import { evaluateWhatIfScenario } from '../lib/optimizerEngine';

interface WhatIfSimulationLabProps {
  current: ProcessPoint;
  bioreactorType: BioreactorType;
  onApplyInterventionToProcess: (
    aeration: number,
    agitation: number,
    temp: number,
    ph: number
  ) => void;
}

export const WhatIfSimulationLab: React.FC<WhatIfSimulationLabProps> = ({
  current,
  bioreactorType,
  onApplyInterventionToProcess,
}) => {
  const [aeration, setAeration] = useState(current.aeration);
  const [agitation, setAgitation] = useState(current.agitation);
  const [temperature, setTemperature] = useState(current.temperature);
  const [ph, setPh] = useState(current.ph);
  const [substrateAdd, setSubstrateAdd] = useState(0);

  const [scenario, setScenario] = useState<InterventionScenario>(() =>
    evaluateWhatIfScenario(
      current,
      'Baseline scenario',
      current.aeration,
      current.agitation,
      current.temperature,
      current.ph,
      0,
      bioreactorType
    )
  );

  const runScenario = (
    aer: number,
    agit: number,
    temp: number,
    pH: number,
    feed: number
  ) => {
    const result = evaluateWhatIfScenario(
      current,
      `What-if: ${aer.toFixed(1)} vvm, ${agit} rpm`,
      aer,
      agit,
      temp,
      pH,
      feed,
      bioreactorType
    );

    setScenario(result);
  };

  const handleRun = () => {
    runScenario(
      aeration,
      agitation,
      temperature,
      ph,
      substrateAdd
    );
  };

  const handleReset = () => {
    setAeration(current.aeration);
    setAgitation(current.agitation);
    setTemperature(current.temperature);
    setPh(current.ph);
    setSubstrateAdd(0);

    runScenario(
      current.aeration,
      current.agitation,
      current.temperature,
      current.ph,
      0
    );
  };

  const outcomeClass =
    scenario.outcomeRating === 'RESOLVED' ||
    scenario.outcomeRating === 'IMPROVED'
      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60'
      : scenario.outcomeRating === 'WORSENED'
      ? 'text-rose-300 bg-rose-950/60 border-rose-700/60'
      : 'text-amber-300 bg-amber-950/60 border-amber-700/60';

  const oxygenPositive = scenario.projectedOxygenBalance >= 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-4 text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              What-If Simulation
            </h3>

            <p className="text-[11px] sm:text-xs text-slate-400">
              Test process changes safely before applying them to the simulation
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-1 rounded">
          IN SILICO
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">

        {/* Controls */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Scenario Controls
              </span>
            </div>

            <span className="text-[10px] text-slate-500">
              Adjustable
            </span>
          </div>

          {/* Aeration */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-300">
                Aeration
              </span>

              <span className="text-xs font-mono font-bold text-cyan-300">
                {aeration.toFixed(1)} vvm
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={aeration}
              onChange={(e) => setAeration(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />

            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0.5</span>
              <span>Baseline {current.aeration.toFixed(1)}</span>
              <span>3.0</span>
            </div>
          </div>

          {/* Agitation */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-300">
                {bioreactorType === 'stirred_tank'
                  ? 'Agitation'
                  : 'Circulation'}
              </span>

              <span className="text-xs font-mono font-bold text-cyan-300">
                {agitation} rpm
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="500"
              step="25"
              value={agitation}
              onChange={(e) => setAgitation(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />

            <div className="flex justify-between text-[9px] text-slate-500">
              <span>100</span>
              <span>Baseline {current.agitation}</span>
              <span>500</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-300">
                Temperature
              </span>

              <span className="text-xs font-mono font-bold text-amber-300">
                {temperature.toFixed(1)} °C
              </span>
            </div>

            <input
              type="range"
              min="32"
              max="42"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-amber-500"
            />

            <div className="flex justify-between text-[9px] text-slate-500">
              <span>32°C</span>
              <span>Target 37°C</span>
              <span>42°C</span>
            </div>
          </div>

          {/* Feed */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-300">
                Feed Addition
              </span>

              <span className="text-xs font-mono font-bold text-purple-300">
                +{substrateAdd.toFixed(1)} g/L
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={substrateAdd}
              onChange={(e) => setSubstrateAdd(Number(e.target.value))}
              className="w-full accent-purple-500"
            />

            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0</span>
              <span>+15 g/L</span>
            </div>
          </div>

          {/* Run / Reset */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleRun}
              className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Simulation
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Reset to current process"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Simulation Result
              </div>

              <div className="text-[10px] text-slate-500 mt-1">
                Current process vs simulated strategy
              </div>
            </div>

            <span
              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${outcomeClass}`}
            >
              {scenario.outcomeRating}
            </span>
          </div>

          {/* Key results */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            <Metric
              label="Projected DO"
              value={`${scenario.projectedDO.toFixed(1)}%`}
              delta={scenario.deltaDO}
              unit="%"
            />

            <Metric
              label="O₂ Balance"
              value={`${scenario.projectedOxygenBalance >= 0 ? '+' : ''}${scenario.projectedOxygenBalance.toFixed(1)}`}
              delta={scenario.deltaOxygenBalance}
              unit="mM/h"
              positive={oxygenPositive}
            />

            <Metric
              label="Biomass"
              value={`${scenario.projectedBiomass.toFixed(2)}`}
              delta={scenario.deltaBiomass}
              unit="g/L"
            />

            <Metric
              label="Product"
              value={`${scenario.projectedProduct.toFixed(2)}`}
              delta={scenario.deltaProduct}
              unit="g/L"
            />

          </div>

          {/* OTR / OUR */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500">
                Oxygen Transfer
              </div>

              <div className="text-lg font-mono font-bold text-cyan-300 mt-1">
                {scenario.projectedOTR.toFixed(1)}
                <span className="text-[10px] text-slate-500 ml-1">
                  mM/h
                </span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
              <div className="text-[10px] uppercase text-slate-500">
                Oxygen Demand
              </div>

              <div className="text-lg font-mono font-bold text-orange-300 mt-1">
                {scenario.projectedOUR.toFixed(1)}
                <span className="text-[10px] text-slate-500 ml-1">
                  mM/h
                </span>
              </div>
            </div>

          </div>

          {/* Explanation */}
          <div className="mt-3 bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="flex items-start gap-2">
              {oxygenPositive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}

              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Model Interpretation
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {scenario.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Apply */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="text-[10px] text-slate-500">
              Simulation only — no physical equipment is controlled.
            </div>

            <button
              onClick={() =>
                onApplyInterventionToProcess(
                  aeration,
                  agitation,
                  temperature,
                  ph
                )
              }
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply to Simulation
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- */
/* Metric Card                                                    */
/* ------------------------------------------------------------- */

interface MetricProps {
  label: string;
  value: string;
  delta: number;
  unit: string;
  positive?: boolean;
}

const Metric: React.FC<MetricProps> = ({
  label,
  value,
  delta,
  unit,
  positive = true,
}) => {
  const deltaPositive = delta >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className="text-[10px] uppercase font-bold text-slate-500">
        {label}
      </div>

      <div className="text-lg font-mono font-bold text-slate-100 mt-1">
        {value}
        <span className="text-[10px] text-slate-500 ml-1">
          {unit}
        </span>
      </div>

      <div
        className={`text-[10px] font-mono font-bold mt-1 ${
          (positive && deltaPositive) || (!positive && !deltaPositive)
            ? 'text-emerald-400'
            : 'text-rose-400'
        }`}
      >
        {deltaPositive ? '+' : ''}
        {delta.toFixed(2)}
      </div>
    </div>
  );
};