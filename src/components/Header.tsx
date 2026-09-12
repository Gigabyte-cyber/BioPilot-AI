import React from 'react';
import {
  Activity,
  Award,
  FileSpreadsheet,
  PlayCircle,
  Sliders,
  Zap,
  FlaskConical,
} from 'lucide-react';

import { BioreactorType } from '../types/bioprocess';
import { DEFAULT_PRODUCT, ProductProfile } from '../types/product';

interface HeaderProps {
  bioreactorType: BioreactorType;
  onSelectBioreactorType?: (type: BioreactorType) => void;

  simulationTime?: number;

  activeView?: 'console' | 'demo' | 'challenge' | 'judge';

  activeTab?: 'workspace' | 'competition' | 'challenge' | 'judge' | 'python';

  setActiveTab?: (
    tab: 'workspace' | 'competition' | 'challenge' | 'judge' | 'python'
  ) => void;

  onSelectView?: (
    view: 'console' | 'demo' | 'challenge' | 'judge'
  ) => void;

  onExportCSV?: () => void;

  isRunning?: boolean;

  activeProduct?: ProductProfile;

  onOpenProductConfig?: () => void;

  maxBatchHours?: number;
}

export const Header: React.FC<HeaderProps> = ({
  bioreactorType,
  onSelectBioreactorType,

  simulationTime = 0,

  activeView,

  activeTab = 'workspace',
  setActiveTab,
  onSelectView,

  onExportCSV,

  isRunning = false,

  activeProduct = DEFAULT_PRODUCT,

  onOpenProductConfig,

  maxBatchHours = 24,
}) => {
  const currentTab =
    activeTab ||
    (activeView === 'console'
      ? 'workspace'
      : activeView === 'demo'
      ? 'competition'
      : activeView) ||
    'workspace';

  const handleTabChange = (
    tab: 'workspace' | 'competition' | 'challenge' | 'judge'
  ) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }

    if (onSelectView) {
      if (tab === 'workspace') {
        onSelectView('console');
      } else if (tab === 'competition') {
        onSelectView('demo');
      } else if (tab === 'challenge') {
        onSelectView('challenge');
      } else if (tab === 'judge') {
        onSelectView('judge');
      }
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0d1424]/95 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto">

        {/* =========================================================
            TOP HEADER
        ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          {/* BRAND */}
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-xl">🧬</span>
            </div>

            <div>
              <div className="flex items-center gap-2">

                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  BIOPILOT
                  <span className="ml-1.5 text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50">
                    AI
                  </span>
                </h1>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRunning
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-slate-500'
                    }`}
                  />

                  {isRunning ? 'SIMULATION RUNNING' : 'SIMULATION READY'}
                </span>

              </div>

              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Agentic AI Digital Bioprocess Engineer
              </p>

            </div>
          </div>


          {/* =========================================================
              PROCESS CONTROLS
          ========================================================= */}
          <div className="flex flex-wrap items-center gap-2">

            {/* BIOREACTOR */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800">

              <span className="text-[10px] uppercase font-bold text-slate-500 px-2">
                Vessel
              </span>

              <button
                onClick={() =>
                  onSelectBioreactorType?.('stirred_tank')
                }
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                  bioreactorType === 'stirred_tank'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stirred Tank
              </button>

              <button
                onClick={() =>
                  onSelectBioreactorType?.('airlift')
                }
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  bioreactorType === 'airlift'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                Airlift
              </button>

            </div>


            {/* PRODUCT */}
            {onOpenProductConfig && (
              <button
                onClick={onOpenProductConfig}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 transition-all"
              >
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />

                <span>
                  {activeProduct.shortName}
                </span>
              </button>
            )}


            {/* SIMULATION TIME */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Batch
              </span>

              <span className="font-mono text-cyan-300 font-bold text-sm">
                {(simulationTime ?? 0).toFixed(1)}h
              </span>

              <span className="text-slate-600 text-xs">
                /
              </span>

              <span className="font-mono text-slate-400 text-xs">
                {maxBatchHours.toFixed(0)}h
              </span>

            </div>

          </div>
        </div>


        {/* =========================================================
            NAVIGATION
        ========================================================= */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

          <div className="flex flex-wrap items-center gap-1.5">

            {/* WORKSPACE */}
            <button
              onClick={() => handleTabChange('workspace')}
              className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentTab === 'workspace'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Console
            </button>


            {/* DEMO */}
            <button
              onClick={() => handleTabChange('competition')}
              className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentTab === 'competition'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Demo
            </button>


            {/* CHALLENGE */}
            <button
              onClick={() => handleTabChange('challenge')}
              className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentTab === 'challenge'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Challenge
            </button>


            {/* JUDGE */}
            <button
              onClick={() => handleTabChange('judge')}
              className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                currentTab === 'judge'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Judge
            </button>

          </div>


          {/* EXPORT */}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-all"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              Export CSV
            </button>
          )}

        </div>

      </div>
    </header>
  );
};