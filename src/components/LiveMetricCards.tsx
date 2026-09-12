/**
 * BIOPILOT AI - Live Bioprocess Metric Cards
 *
 * Displays real-time process variables from the digital twin.
 * Specific growth rate (μ) is recalculated directly from the
 * current process state to ensure the displayed value remains
 * consistent with the Monod model.
 */

import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Droplet,
  Flame,
  Gauge,
  Layers,
  Sparkles,
  Thermometer,
  Wind,
} from 'lucide-react';

import {
  ProcessPoint,
  RiskAssessment,
  TrajectoryMetrics,
  BioreactorType,
} from '../types/bioprocess';

import {
  computeDerivatives,
  DEFAULT_PARAMETERS,
} from '../lib/bioprocessModel';

import {
  DEFAULT_PRODUCT,
} from '../types/product';

interface LiveMetricCardsProps {
  current?: ProcessPoint;
  trajectories?: TrajectoryMetrics;
  risk?: RiskAssessment;
}

export const LiveMetricCards: React.FC<LiveMetricCardsProps> = ({
  current,
  trajectories,
  risk,
}) => {
  if (!current) {
    return null;
  }

  // ------------------------------------------------------------
  // Risk colour
  // ------------------------------------------------------------

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-rose-800/80 bg-rose-950/30 text-rose-300';

      case 'WARNING':
        return 'border-amber-800/80 bg-amber-950/30 text-amber-300';

      case 'ENDPOINT':
        return 'border-purple-800/80 bg-purple-950/30 text-purple-300';

      default:
        return 'border-slate-800 bg-slate-900/80 text-slate-100';
    }
  };

  // ------------------------------------------------------------
  // Trend icon
  // ------------------------------------------------------------

  const getTrendIcon = (trend?: string) => {
    if (!trend) {
      return (
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 inline" />
      );
    }

    if (trend.includes('INCREASING')) {
      return (
        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 inline" />
      );
    }

    if (trend.includes('DECREASING')) {
      return (
        <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 inline" />
      );
    }

    return (
      <ArrowRight className="w-3.5 h-3.5 text-slate-400 inline" />
    );
  };

  // ------------------------------------------------------------
  // Current values
  // ------------------------------------------------------------

  const biomassVal = current.biomass ?? 0;
  const substrateVal = current.substrate ?? 0;
  const productVal = current.product ?? 0;
  const doVal = current.do ?? 0;
  const obVal = current.oxygenBalance ?? 0;
  const otrVal = current.otr ?? 0;
  const ourVal = current.our ?? 0;
  const phVal = current.ph ?? 7.0;
  const tempVal = current.temperature ?? 37.0;

  // ------------------------------------------------------------
  // IMPORTANT:
  // Recalculate specific growth rate directly from the
  // mathematical digital twin.
  //
  // This uses:
  //
  // μ = μmax × S/(Ks+S) × CL/(Ko2+CL)
  //     × temperature factor × pH factor
  //
  // instead of trusting a possibly stale stored value.
  // ------------------------------------------------------------

  let calculatedMu = 0;

  try {
    const deriv = computeDerivatives(
      current,
      DEFAULT_PARAMETERS,
      'stirred_tank' as BioreactorType,
      DEFAULT_PRODUCT
    );

    if (
      Number.isFinite(deriv.mu) &&
      deriv.mu >= 0
    ) {
      calculatedMu = deriv.mu;
    }
  } catch (error) {
    console.error(
      'BioPilot growth-rate calculation error:',
      error
    );
  }

  // Safety fallback.
  // If calculation somehow fails, use the process state's
  // stored growth rate rather than displaying zero.
  const muVal =
    calculatedMu > 0
      ? calculatedMu
      : Math.max(
          0,
          current.specificGrowthRate ?? 0
        );

  const metrics = [
    {
      id: 'biomass',
      label: 'Biomass (X)',
      value: biomassVal.toFixed(2),
      unit: 'g/L',
      preferred: 'Target > 3.0 g/L',
      trend:
        trajectories?.biomass?.trend ??
        'STABLE',
      rate:
        trajectories?.biomass?.rateText ??
        '',
      icon: (
        <Layers className="w-4 h-4 text-cyan-400" />
      ),
      riskLevel: 'NORMAL',
    },

    {
      id: 'substrate',
      label: 'Substrate (S)',
      value: substrateVal.toFixed(2),
      unit: 'g/L',
      preferred: '3.0 – 25.0 g/L',
      trend:
        trajectories?.substrate?.trend ??
        'STABLE',
      rate:
        trajectories?.substrate?.rateText ??
        '',
      icon: (
        <Droplet className="w-4 h-4 text-blue-400" />
      ),
      riskLevel:
        substrateVal < 0.4
          ? 'ENDPOINT'
          : substrateVal < 1.8
            ? 'WARNING'
            : 'NORMAL',
    },

    {
      id: 'product',
      label: 'Product (P)',
      value: productVal.toFixed(2),
      unit: 'g/L',
      preferred: 'Yp/x = 0.28',
      trend:
        trajectories?.product?.trend ??
        'STABLE',
      rate:
        trajectories?.product?.rateText ??
        '',
      icon: (
        <Sparkles className="w-4 h-4 text-purple-400" />
      ),
      riskLevel: 'NORMAL',
    },

    {
      id: 'do',
      label: 'Dissolved Oxygen (DO)',
      value: doVal.toFixed(1),
      unit: '%',
      preferred: '30.0% – 60.0%',
      trend:
        trajectories?.do?.trend ??
        'STABLE',
      rate:
        trajectories?.do?.rateText ??
        '',
      icon: (
        <Wind className="w-4 h-4 text-sky-400" />
      ),
      riskLevel:
        doVal < 15.0
          ? 'CRITICAL'
          : doVal < 28.0
            ? 'WARNING'
            : 'NORMAL',
    },

    {
      id: 'growthRate',
      label: 'Specific Growth Rate (μ)',
      value: muVal.toFixed(3),
      unit: 'h⁻¹',
      preferred: `μmax = ${DEFAULT_PARAMETERS.muMax.toFixed(2)} h⁻¹`,
      trend:
        trajectories?.growthRate?.trend ??
        'STABLE',
      rate:
        trajectories?.growthRate?.rateText ??
        '',
      icon: (
        <Activity className="w-4 h-4 text-emerald-400" />
      ),
      riskLevel:
        muVal < 0.02
          ? 'WARNING'
          : 'NORMAL',
    },

    {
      id: 'oxygenBalance',
      label: 'Oxygen Balance (OTR - OUR)',
      value:
        obVal > 0
          ? `+${obVal.toFixed(1)}`
          : obVal.toFixed(1),
      unit: 'mmol/L/h',
      preferred: '≥ 0.0 mmol/L/h',
      trend:
        trajectories?.oxygenBalance?.trend ??
        'STABLE',
      rate:
        trajectories?.oxygenBalance?.rateText ??
        '',
      icon: (
        <Gauge className="w-4 h-4 text-indigo-400" />
      ),
      riskLevel:
        obVal < -5.0
          ? 'CRITICAL'
          : obVal < 0
            ? 'WARNING'
            : 'NORMAL',
    },

    {
      id: 'otr',
      label: 'Oxygen Transfer Rate (OTR)',
      value: otrVal.toFixed(1),
      unit: 'mmol/L/h',
      preferred: 'kLa × (C* - CL)',
      trend: 'STABLE',
      rate:
        `kLa: ${current.kla ?? 0} h⁻¹`,
      icon: (
        <Wind className="w-4 h-4 text-teal-400" />
      ),
      riskLevel: 'NORMAL',
    },

    {
      id: 'our',
      label: 'Oxygen Demand (OUR)',
      value: ourVal.toFixed(1),
      unit: 'mmol/L/h',
      preferred: 'Biomass Respiration',
      trend:
        trajectories?.biomass?.trend ??
        'STABLE',
      rate: 'qO2: 7.8 mmol/g/h',
      icon: (
        <Flame className="w-4 h-4 text-orange-400" />
      ),
      riskLevel:
        ourVal > otrVal
          ? 'WARNING'
          : 'NORMAL',
    },

    {
      id: 'ph',
      label: 'Broth pH',
      value: phVal.toFixed(2),
      unit: 'pH',
      preferred: '6.80 – 7.20',
      trend: 'STABLE',
      rate: 'Buffer Control Active',
      icon: (
        <Activity className="w-4 h-4 text-lime-400" />
      ),
      riskLevel:
        phVal < 6.5 || phVal > 7.5
          ? 'CRITICAL'
          : phVal < 6.7 || phVal > 7.3
            ? 'WARNING'
            : 'NORMAL',
    },

    {
      id: 'temp',
      label: 'Temperature',
      value: tempVal.toFixed(1),
      unit: '°C',
      preferred: '36.5°C – 37.5°C',
      trend: 'STABLE',
      rate: 'Cooling Jacket Active',
      icon: (
        <Thermometer className="w-4 h-4 text-amber-400" />
      ),
      riskLevel:
        Math.abs(tempVal - 37.0) > 1.5
          ? 'CRITICAL'
          : Math.abs(tempVal - 37.0) > 0.6
            ? 'WARNING'
            : 'NORMAL',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-4 text-left">

      {metrics.map((m) => {
        const isAlert =
          m.riskLevel !== 'NORMAL';

        return (
          <div
            key={m.id}
            className={`border rounded-xl p-3 shadow-md transition-all hover:border-slate-700 ${getRiskColor(
              m.riskLevel
            )}`}
          >

            <div className="flex items-center justify-between gap-1 mb-1">

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">
                {m.icon}

                <span className="truncate">
                  {m.label}
                </span>
              </div>

              {isAlert && (
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {m.riskLevel}
                </span>
              )}

            </div>

            <div className="flex items-baseline gap-1 mt-1">

              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
                {m.value}
              </span>

              <span className="text-xs text-slate-400 font-mono">
                {m.unit}
              </span>

            </div>

            <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-800/60 text-[10px]">

              <span className="text-slate-400 truncate">
                {m.preferred}
              </span>

              <span className="font-mono flex items-center gap-0.5 text-slate-300 font-medium">
                {getTrendIcon(m.trend)}
                {m.rate}
              </span>

            </div>

          </div>
        );
      })}

    </div>
  );
};