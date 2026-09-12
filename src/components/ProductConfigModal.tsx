import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  Clock,
  Dna,
  Edit3,
  Factory,
  FlaskConical,
  Info,
  Layers,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { DEFAULT_PRODUCT, PRESET_PRODUCTS, ProductProfile, ProductTypeCategory, ShearSensitivity } from '../types/product';

interface ProductConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProduct: ProductProfile;
  batchHours: number;
  onSelectProduct: (product: ProductProfile, newBatchHours: number) => void;
}

export const ProductConfigModal: React.FC<ProductConfigModalProps> = ({
  isOpen,
  onClose,
  activeProduct,
  batchHours,
  onSelectProduct,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activeProduct.id);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(activeProduct.id === 'custom');

  // Working draft state
  const [name, setName] = useState<string>(activeProduct.name);
  const [shortName, setShortName] = useState<string>(activeProduct.shortName);
  const [category, setCategory] = useState<ProductTypeCategory>(activeProduct.category);
  const [hostOrganism, setHostOrganism] = useState<string>(activeProduct.hostOrganism);
  const [description, setDescription] = useState<string>(activeProduct.description);
  const [duration, setDuration] = useState<number>(batchHours || activeProduct.defaultBatchHours);
  const [targetYieldYpx, setTargetYieldYpx] = useState<number>(activeProduct.targetYieldYpx);
  const [initialSubstrate, setInitialSubstrate] = useState<number>(activeProduct.initialSubstrate);
  const [criticalDO, setCriticalDO] = useState<number>(activeProduct.criticalDO);
  const [shearSensitivity, setShearSensitivity] = useState<ShearSensitivity>(activeProduct.shearSensitivity);
  const [maxRecommendedRpm, setMaxRecommendedRpm] = useState<number>(activeProduct.maxRecommendedRpm);
  const [feedingStrategy, setFeedingStrategy] = useState<'batch' | 'fed_batch'>(activeProduct.feedingStrategy);
  const [optimalTemp, setOptimalTemp] = useState<number>(activeProduct.optimalTemp);
  const [optimalPh, setOptimalPh] = useState<number>(activeProduct.optimalPh);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ProductProfile) => {
    setSelectedPresetId(preset.id);
    setIsCustomMode(false);
    setName(preset.name);
    setShortName(preset.shortName);
    setCategory(preset.category);
    setHostOrganism(preset.hostOrganism);
    setDescription(preset.description);
    setDuration(preset.defaultBatchHours);
    setTargetYieldYpx(preset.targetYieldYpx);
    setInitialSubstrate(preset.initialSubstrate);
    setCriticalDO(preset.criticalDO);
    setShearSensitivity(preset.shearSensitivity);
    setMaxRecommendedRpm(preset.maxRecommendedRpm);
    setFeedingStrategy(preset.feedingStrategy);
    setOptimalTemp(preset.optimalTemp);
    setOptimalPh(preset.optimalPh);
  };

  const handleApply = () => {
    const updatedProduct: ProductProfile = {
      id: isCustomMode ? 'custom' : selectedPresetId,
      name,
      shortName: shortName || name.slice(0, 15),
      category,
      hostOrganism,
      description,
      defaultBatchHours: duration,
      maxBatchHours: 48.0,
      targetYieldYpx,
      luedekingPiret: {
        alpha: Number((targetYieldYpx * 0.4).toFixed(3)),
        beta: Number((targetYieldYpx * 0.1).toFixed(3)),
      },
      initialSubstrate,
      initialBiomass: 0.35,
      criticalDO,
      optimalDO: Math.min(65, criticalDO + 15),
      shearSensitivity,
      maxRecommendedRpm,
      optimalTemp,
      optimalPh,
      feedingStrategy,
      unit: 'g/L',
    };

    onSelectProduct(updatedProduct, duration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Bioproduct & Batch Duration Specification
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Up to 48.0 Hours
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure production biokinetics, critical limits, and flexible batch duration for any target molecule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-slate-300 custom-scrollbar">
          {/* Preset Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Select Preset Bioproduct or Configure Custom:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_PRODUCTS.map((preset) => {
                const isSelected = !isCustomMode && selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs line-clamp-1">{preset.shortName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{preset.hostOrganism}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{preset.defaultBatchHours}h batch</span>
                      <span className="capitalize">{preset.feedingStrategy}</span>
                    </div>
                  </button>
                );
              })}

              {/* Custom Product Card */}
              <button
                onClick={() => {
                  setIsCustomMode(true);
                  setSelectedPresetId('custom');
                  setName('Custom Recombinant Protein / Chemical');
                  setShortName('Custom Protein');
                }}
                className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isCustomMode
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Custom Product
                    </span>
                    {isCustomMode && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">User-defined strain & kinetics</p>
                </div>
                <div className="mt-2 text-[10px] text-emerald-400 font-mono">Fully Configurable</div>
              </button>
            </div>
          </div>

          {/* Core Configuration Section */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                1. Flexible Batch Duration (Hours within 48h)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded border border-cyan-800/60">
                {duration.toFixed(1)} Hours Total
              </span>
            </div>

            {/* Quick Batch Duration Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Quick Duration:</span>
              {[12, 24, 36, 48].map((h) => (
                <button
                  key={h}
                  onClick={() => setDuration(h)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition border ${
                    duration === h
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            {/* Continuous Duration Slider (1.0 to 48.0 hours) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>1.0 Hour (Rapid Screen)</span>
                <span className="text-white font-bold">{duration.toFixed(1)} Hours</span>
                <span>48.0 Hours (Full Extended Cultivation)</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="48.0"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Product Profile & Host Strain Details */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <Dna className="w-4 h-4 text-emerald-400" />
              2. Product & Host Microorganism Specification
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsCustomMode(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Monoclonal Antibody IgG1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Host Strain / Cell Line</label>
                <input
                  type="text"
                  value={hostOrganism}
                  onChange={(e) => {
                    setHostOrganism(e.target.value);
                    setIsCustomMode(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. CHO-K1, E. coli BL21, B. subtilis"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Feeding Strategy</label>
                <select
                  value={feedingStrategy}
                  onChange={(e) => setFeedingStrategy(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                >
                  <option value="fed_batch">Fed-Batch (Continuous 48h pulse)</option>
                  <option value="batch">Batch (Single initial charge)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Substrate S₀ (g/L)</label>
                <input
                  type="number"
                  min="10"
                  max="80"
                  value={initialSubstrate}
                  onChange={(e) => setInitialSubstrate(parseFloat(e.target.value) || 25)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Yield Yp/x (g/g biomass)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1.5"
                  value={targetYieldYpx}
                  onChange={(e) => setTargetYieldYpx(parseFloat(e.target.value) || 0.35)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Biological Risk Thresholds */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              3. Critical Risk Boundaries & Shear Limits
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Critical DO Threshold (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={criticalDO}
                    onChange={(e) => setCriticalDO(parseFloat(e.target.value) || 20)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Triggers severe hypoxia risk when breached.</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Shear Sensitivity</label>
                <select
                  value={shearSensitivity}
                  onChange={(e) => {
                    const sens = e.target.value as ShearSensitivity;
                    setShearSensitivity(sens);
                    if (sens === 'HIGH') setMaxRecommendedRpm(240);
                    else if (sens === 'MEDIUM') setMaxRecommendedRpm(350);
                    else setMaxRecommendedRpm(450);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
                >
                  <option value="HIGH">HIGH (Mammalian / CHO)</option>
                  <option value="MEDIUM">MEDIUM (Filamentous / Bacillus)</option>
                  <option value="LOW">LOW (Prokaryotic E. coli / Yeast)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Safe max: {maxRecommendedRpm} rpm.</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Safe Agitation (rpm)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    max="600"
                    value={maxRecommendedRpm}
                    onChange={(e) => setMaxRecommendedRpm(parseInt(e.target.value, 10) || 300)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">rpm</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Warns if agitation exceeds this ceiling.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Optimal Broth Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  min="25"
                  max="45"
                  value={optimalTemp}
                  onChange={(e) => setOptimalTemp(parseFloat(e.target.value) || 37.0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Optimal Broth pH</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="9.0"
                  value={optimalPh}
                  onChange={(e) => setOptimalPh(parseFloat(e.target.value) || 7.0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Updates digital twin kinetics, risk thresholds, and charts instantly.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply {name.split(' ')[0]} ({duration}h)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
