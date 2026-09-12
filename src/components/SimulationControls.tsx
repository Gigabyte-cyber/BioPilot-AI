import React from 'react';
import {
  Clock,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
} from 'lucide-react';
import { ProductProfile } from '../types/product';

interface SimulationControlsProps {
  isPlaying?: boolean;
  isRunning?: boolean;

  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;

  speed?: number;
  simulationSpeed?: number;
  onSetSpeed?: (speed: number) => void;
  onChangeSpeed?: (speed: number) => void;

  simulationTime?: number;
  currentTime?: number;

  maxTime?: number;

  onJumpToTime?: (targetTime: number) => void;
  onSeekTime?: (targetTime: number) => void;

  activeProduct?: ProductProfile;
  onOpenProductConfig?: () => void;

  onChangeBatchDuration?: (hours: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  isRunning,
  onTogglePlay,
  onStepForward,
  onReset,

  speed,
  simulationSpeed,
  onSetSpeed,
  onChangeSpeed,

  simulationTime,
  currentTime,

  maxTime = 24,

  onJumpToTime,
  onSeekTime,

  activeProduct,
  onOpenProductConfig,

  onChangeBatchDuration,
}) => {
  const activePlaying = isPlaying ?? isRunning ?? false;
  const activeSpeed = speed ?? simulationSpeed ?? 1;
  const activeTime = simulationTime ?? currentTime ?? 0;

  const progress =
    maxTime > 0
      ? Math.min(100, Math.max(0, (activeTime / maxTime) * 100))
      : 0;

  const handleSeek = (targetTime: number) => {
    const clampedTime = Math.max(0, Math.min(maxTime, targetTime));

    if (onJumpToTime) {
      onJumpToTime(clampedTime);
    } else if (onSeekTime) {
      onSeekTime(clampedTime);
    }
  };

  const handleSpeed = (newSpeed: number) => {
    if (onSetSpeed) {
      onSetSpeed(newSpeed);
    } else if (onChangeSpeed) {
      onChangeSpeed(newSpeed);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-xl text-left">
      {/* Main controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Run / Pause */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activePlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {activePlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}

            {activePlaying ? 'Pause Simulation' : 'Run Simulation'}
          </button>

          {/* Step */}
          <button
            onClick={onStepForward}
            disabled={activePlaying}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition"
            title="Advance the simulation by one integration step"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
            Step
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold px-1">
              Speed
            </span>

            {[1, 2, 5, 10].map((value) => (
              <button
                key={value}
                onClick={() => handleSpeed(value)}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition ${
                  activeSpeed === value
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>

        {/* Product */}
        <div className="flex items-center gap-2">
          {activeProduct && onOpenProductConfig && (
            <button
              onClick={onOpenProductConfig}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs transition"
              title="Configure product profile"
            >
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />

              <span className="font-bold text-cyan-300">
                {activeProduct.shortName}
              </span>
            </button>
          )}

          {/* Duration */}
          {onChangeBatchDuration && (
            <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold px-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration
              </span>

              {[12, 24, 36, 48].map((hours) => (
                <button
                  key={hours}
                  onClick={() => onChangeBatchDuration(hours)}
                  className={`text-[11px] font-mono px-2 py-1 rounded-lg transition ${
                    maxTime === hours
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Simulation Time
            </span>

            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/50 px-2 py-1 rounded-lg">
              {activeTime.toFixed(1)} h
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            {progress.toFixed(0)}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={maxTime}
          step="0.1"
          value={activeTime}
          onChange={(event) =>
            handleSeek(Number(event.target.value))
          }
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-600">
          <span>0 h</span>
          <span>{(maxTime / 2).toFixed(0)} h</span>
          <span>{maxTime.toFixed(0)} h</span>
        </div>
      </div>
    </div>
  );
};