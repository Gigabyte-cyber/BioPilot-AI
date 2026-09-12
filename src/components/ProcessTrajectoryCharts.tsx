import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ProcessPoint } from '../types/bioprocess';
import { DEFAULT_PRODUCT, ProductProfile } from '../types/product';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LineChart as LineChartIcon,
} from 'lucide-react';

interface ProcessTrajectoryChartsProps {
  history: ProcessPoint[];
  product?: ProductProfile;
  maxBatchHours?: number;
  currentTime?: number;
}

export const ProcessTrajectoryCharts: React.FC<
  ProcessTrajectoryChartsProps
> = ({
  history,
  product = DEFAULT_PRODUCT,
  maxBatchHours = 24,
  currentTime,
}) => {
  const latest: ProcessPoint = history[history.length - 1] || {
    time: 0,
    biomass: 0.35,
    substrate: product.initialSubstrate,
    product: 0.05,
    do: 98,
    temperature: 37,
    ph: 7,
    volume: 10,
    aeration: 1,
    agitation: 250,
    feedRate: 0,
    otr: 12,
    our: 1.8,
    oxygenBalance: 10.2,
    kla: 65,
    specificGrowthRate: 0,
  };

  const horizon = Math.max(
    1,
    maxBatchHours || latest.time || 24
  );

  const activeCurrentTime = Math.min(
    currentTime ?? latest.time,
    horizon
  );

  const chartData = history.map((pt) => ({
    time: Number(pt.time.toFixed(2)),
    biomass: Number(pt.biomass.toFixed(3)),
    substrate: Number(pt.substrate.toFixed(2)),
    product: Number(pt.product.toFixed(3)),
    do: Number(pt.do.toFixed(1)),
    otr: Number(pt.otr.toFixed(2)),
    our: Number(pt.our.toFixed(2)),
  }));

  const critDO = product.criticalDO ?? 20;
  const targetDO = Math.max(35, critDO + 15);

  const xAxisTicks = Array.from(
    { length: Math.floor(horizon / 6) + 1 },
    (_, i) => i * 6
  ).filter((tick) => tick <= horizon);

  if (!xAxisTicks.includes(horizon)) {
    xAxisTicks.push(Number(horizon.toFixed(1)));
  }

  const renderTooltip = ({
    active,
    payload,
    label,
  }: any) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl min-w-[180px]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-2">
          <Clock className="w-3.5 h-3.5" />
          {Number(label).toFixed(1)} h
        </div>

        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="text-slate-400">
                {item.name}
              </span>

              <span className="font-mono font-bold text-slate-100">
                {typeof item.value === 'number'
                  ? item.value.toFixed(2)
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const doCritical = latest.do < critDO;
  const oxygenDeficit = latest.otr < latest.our;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-4 text-left">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800">

        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <LineChartIcon className="w-4 h-4 text-cyan-400" />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              Process Trajectories
            </h3>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Key process variables across the simulated batch.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Time</span>
            <span className="font-mono font-bold text-cyan-300">
              {activeCurrentTime.toFixed(1)}h
            </span>
            <span className="text-slate-600">
              /
            </span>
            <span className="font-mono text-slate-400">
              {horizon.toFixed(1)}h
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            {doCritical ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300 font-semibold">
                  DO Critical
                </span>
              </>
            ) : oxygenDeficit ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-semibold">
                  O₂ Demand High
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  Process Stable
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

        {/* =====================================================
            1. BIOMASS + PRODUCT
        ===================================================== */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">

          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Biomass & Product
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Growth and product accumulation
              </p>
            </div>

            <div className="text-right font-mono text-[10px]">
              <div className="text-sky-300">
                X {latest.biomass.toFixed(2)} g/L
              </div>

              <div className="text-purple-300">
                P {latest.product.toFixed(2)} g/L
              </div>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -15,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />

                <XAxis
                  type="number"
                  dataKey="time"
                  domain={[0, horizon]}
                  ticks={xAxisTicks}
                  tickFormatter={(value) => `${value}h`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                />

                <YAxis
                  domain={[0, 'auto']}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                  unit=" g/L"
                />

                <Tooltip content={renderTooltip} />

                <ReferenceLine
                  x={activeCurrentTime}
                  stroke="#06b6d4"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />

                <Line
                  type="monotone"
                  dataKey="biomass"
                  name="Biomass X (g/L)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="product"
                  name={`Product P (g/L)`}
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  dot={false}
                  strokeDasharray="5 3"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =====================================================
            2. SUBSTRATE
        ===================================================== */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">

          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Substrate
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Carbon availability during cultivation
              </p>
            </div>

            <span className="font-mono text-[10px] font-bold text-blue-300">
              {latest.substrate.toFixed(2)} g/L
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -15,
                  bottom: 4,
                }}
              >
                <defs>
                  <linearGradient
                    id="substrateGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#3b82f6"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />

                <XAxis
                  type="number"
                  dataKey="time"
                  domain={[0, horizon]}
                  ticks={xAxisTicks}
                  tickFormatter={(value) => `${value}h`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                />

                <YAxis
                  domain={[0, 'auto']}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                  unit=" g/L"
                />

                <Tooltip content={renderTooltip} />

                <ReferenceLine
                  x={activeCurrentTime}
                  stroke="#06b6d4"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />

                <Area
                  type="monotone"
                  dataKey="substrate"
                  name="Substrate S (g/L)"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  fill="url(#substrateGradient)"
                  fillOpacity={1}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =====================================================
            3. DISSOLVED OXYGEN
        ===================================================== */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">

          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Dissolved Oxygen
              </h4>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Oxygen availability for aerobic growth
              </p>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold ${
                doCritical
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}
            >
              {doCritical ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}

              {latest.do.toFixed(1)}%
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -15,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />

                <XAxis
                  type="number"
                  dataKey="time"
                  domain={[0, horizon]}
                  ticks={xAxisTicks}
                  tickFormatter={(value) => `${value}h`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                  unit="%"
                />

                <Tooltip content={renderTooltip} />

                <ReferenceLine
                  y={targetDO}
                  stroke="#10b981"
                  strokeDasharray="4 3"
                  label={{
                    value: `Target ${targetDO}%`,
                    fill: '#34d399',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />

                <ReferenceLine
                  y={critDO}
                  stroke="#f43f5e"
                  strokeDasharray="4 3"
                  label={{
                    value: `Critical ${critDO}%`,
                    fill: '#fb7185',
                    fontSize: 9,
                    position: 'insideBottomRight',
                  }}
                />

                <ReferenceLine
                  x={activeCurrentTime}
                  stroke="#06b6d4"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />

                <Line
                  type="monotone"
                  dataKey="do"
                  name="DO (%)"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =====================================================
            4. OXYGEN TRANSFER VS DEMAND
        ===================================================== */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">

          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Oxygen Transfer vs Demand
              </h4>

              <p className="text-[10px] text-slate-500 mt-0.5">
                OTR versus cellular oxygen demand
              </p>
            </div>

            <div className="text-right font-mono text-[10px]">
              <div className="text-teal-300">
                OTR {latest.otr.toFixed(2)}
              </div>

              <div className="text-orange-300">
                OUR {latest.our.toFixed(2)} mM/h
              </div>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -15,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />

                <XAxis
                  type="number"
                  dataKey="time"
                  domain={[0, horizon]}
                  ticks={xAxisTicks}
                  tickFormatter={(value) => `${value}h`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                />

                <YAxis
                  domain={[0, 'auto']}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#475569"
                  unit=" mM/h"
                />

                <Tooltip content={renderTooltip} />

                <ReferenceLine
                  x={activeCurrentTime}
                  stroke="#06b6d4"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />

                <Line
                  type="monotone"
                  dataKey="otr"
                  name="OTR (mmol O₂/L/h)"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="our"
                  name="OUR (mmol O₂/L/h)"
                  stroke="#fb923c"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">

        <span>
          Simulation horizon: {horizon.toFixed(1)} h
        </span>

        <span>
          Resolution: {history.length > 1 ? '0.1 h' : '—'}
        </span>

        <span>
          {history.length} process states
        </span>

      </div>
    </div>
  );
};