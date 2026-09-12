import React, { useEffect, useState } from 'react';
import { BioreactorType, ProcessPoint, RiskAssessment } from '../types/bioprocess';
import { Activity, Wind, Zap, Thermometer, Droplets, Gauge } from 'lucide-react';

interface BioreactorVisualizationProps {
  current: ProcessPoint;
  type: BioreactorType;
  risk: RiskAssessment;
  onSelectType: (type: BioreactorType) => void;
}

export const BioreactorVisualization: React.FC<BioreactorVisualizationProps> = ({
  current,
  type,
  risk,
  onSelectType,
}) => {
  const [rotationAngle, setRotationAngle] = useState(0);

  /*
   * Animate the simulated impeller / airlift circulation.
   * This is purely a visual representation of the digital twin.
   */
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const speed =
        type === 'stirred_tank'
          ? current.agitation / 60
          : current.aeration * 1.2;

      setRotationAngle(
        (previous) => (previous + speed * 360 * dt) % 360
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [type, current.agitation, current.aeration]);

  const safeDO = Number(current.do ?? 0);
  const safePH = Number(current.ph ?? 0);
  const safeTemperature = Number(current.temperature ?? 0);
  const safeBiomass = Number(current.biomass ?? 0);
  const safeAeration = Number(current.aeration ?? 0);
  const safeAgitation = Number(current.agitation ?? 0);
  const safeOTR = Number(current.otr ?? 0);
  const safeOUR = Number(current.our ?? 0);
  const safeKla = Number(current.kla ?? 0);

  const isCritical = risk?.overallLevel === 'CRITICAL';
  const isWarning = risk?.overallLevel === 'WARNING';

  /*
   * Broth appearance changes with simulated biomass concentration.
   * This is visual only — it does not represent an experimentally
   * calibrated optical measurement.
   */
  const biomassRatio = Math.min(
    1,
    Math.max(0, (safeBiomass - 0.3) / 5)
  );

  const brothOpacity = 0.45 + biomassRatio * 0.35;

  const brothColor =
    safeDO < 20
      ? `rgba(185, 28, 28, ${brothOpacity})`
      : `rgba(180, 83, 9, ${brothOpacity})`;

  const bubbleCount = Math.min(
    14,
    Math.max(4, Math.round(safeAeration * 6))
  );

  const status =
    isCritical
      ? 'CRITICAL'
      : isWarning
        ? 'WARNING'
        : 'NORMAL';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isCritical
                ? 'bg-rose-400'
                : isWarning
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
            }`}
          />

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Digital Twin Vessel
            </div>

            <div className="text-[11px] text-slate-500 mt-0.5">
              {type === 'stirred_tank'
                ? 'Stirred Tank Reactor (STR)'
                : 'Airlift Reactor (ALR)'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div
            className={`text-[10px] font-bold ${
              isCritical
                ? 'text-rose-400'
                : isWarning
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}
          >
            {status}
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            kLa {safeKla.toFixed(1)} h⁻¹
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <div className="relative h-[310px] flex items-center justify-center">

        <svg
          viewBox="0 0 340 380"
          className="w-full h-full max-h-[300px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>

            {/* Vessel wall */}
            <linearGradient
              id="bp-vessel-wall"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#475569" stopOpacity="0.8" />
              <stop offset="20%" stopColor="#1e293b" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#1e293b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
            </linearGradient>

            {/* Broth */}
            <linearGradient
              id="bp-broth"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#38bdf8"
                stopOpacity={safeDO > 30 ? 0.22 : 0.10}
              />

              <stop
                offset="12%"
                stopColor={brothColor}
              />

              <stop
                offset="100%"
                stopColor={safeDO < 20 ? '#7f1d1d' : '#78350f'}
                stopOpacity="0.9"
              />
            </linearGradient>

            {/* Jacket */}
            <pattern
              id="bp-jacket"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0 9 L 18 9"
                stroke="#0284c7"
                strokeWidth="1"
                strokeOpacity="0.2"
              />
            </pattern>
          </defs>

          {/* Motor */}
          <rect
            x="110"
            y="12"
            width="120"
            height="14"
            rx="3"
            fill="#475569"
            stroke="#64748b"
            strokeWidth="1.5"
          />

          <rect
            x="145"
            y="2"
            width="50"
            height="12"
            rx="2"
            fill="#334155"
          />

          {/* Vessel */}
          <path
            d="M 60 40
               L 60 290
               Q 60 350 170 350
               Q 280 350 280 290
               L 280 40 Z"
            fill="url(#bp-vessel-wall)"
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Cooling jacket */}
          <path
            d="M 52 80
               L 52 280
               Q 52 358 170 358
               Q 288 358 288 280
               L 288 80"
            fill="none"
            stroke="#0284c7"
            strokeWidth="3"
            strokeOpacity="0.35"
          />

          <path
            d="M 52 90
               L 52 270
               Q 52 350 170 350
               Q 288 350 288 270
               L 288 90"
            fill="url(#bp-jacket)"
          />

          {/* Broth */}
          <path
            d="M 64 100
               Q 170 95 276 100
               L 276 290
               Q 276 345 170 345
               Q 64 345 64 290 Z"
            fill="url(#bp-broth)"
          />

          {/* Meniscus */}
          <ellipse
            cx="170"
            cy="100"
            rx="106"
            ry="6"
            fill="#38bdf8"
            fillOpacity="0.2"
          />

          {/* Reactor internals */}
          {type === 'stirred_tank' ? (
            <g>

              {/* Baffles */}
              <rect
                x="68"
                y="110"
                width="6"
                height="180"
                fill="#64748b"
                opacity="0.55"
              />

              <rect
                x="266"
                y="110"
                width="6"
                height="180"
                fill="#64748b"
                opacity="0.55"
              />

              {/* Shaft */}
              <rect
                x="167"
                y="24"
                width="6"
                height="270"
                fill="#94a3b8"
              />

              {/* Upper impeller */}
              <g
                transform={`translate(170, 180) rotate(${rotationAngle})`}
              >
                <ellipse
                  cx="0"
                  cy="0"
                  rx="36"
                  ry="5"
                  fill="#cbd5e1"
                />

                <rect
                  x="-32"
                  y="-12"
                  width="8"
                  height="24"
                  rx="2"
                  fill="#64748b"
                />

                <rect
                  x="24"
                  y="-12"
                  width="8"
                  height="24"
                  rx="2"
                  fill="#64748b"
                />
              </g>

              {/* Lower impeller */}
              <g
                transform={`translate(170, 270) rotate(${rotationAngle})`}
              >
                <ellipse
                  cx="0"
                  cy="0"
                  rx="36"
                  ry="5"
                  fill="#cbd5e1"
                />

                <rect
                  x="-32"
                  y="-12"
                  width="8"
                  height="24"
                  rx="2"
                  fill="#64748b"
                />

                <rect
                  x="24"
                  y="-12"
                  width="8"
                  height="24"
                  rx="2"
                  fill="#64748b"
                />
              </g>

              {/* Sparger */}
              <path
                d="M 130 315 Q 170 322 210 315"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
              />

            </g>
          ) : (
            <g>

              {/* Draft tube */}
              <rect
                x="120"
                y="130"
                width="6"
                height="170"
                rx="2"
                fill="#64748b"
              />

              <rect
                x="214"
                y="130"
                width="6"
                height="170"
                rx="2"
                fill="#64748b"
              />

              {/* Riser flow */}
              <path
                d="M 170 280 L 170 140"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.8"
              />

              <polygon
                points="170,135 165,145 175,145"
                fill="#38bdf8"
              />

              {/* Downcomer flow */}
              <path
                d="M 95 150 L 95 270"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.6"
              />

              <polygon
                points="95,275 90,265 100,265"
                fill="#94a3b8"
              />

              <path
                d="M 245 150 L 245 270"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.6"
              />

              <polygon
                points="245,275 240,265 250,265"
                fill="#94a3b8"
              />

              {/* Airlift sparger */}
              <rect
                x="135"
                y="310"
                width="70"
                height="8"
                rx="2"
                fill="#94a3b8"
              />

            </g>
          )}

          {/* Simulated bubbles */}
          {Array.from({ length: bubbleCount }).map((_, index) => {

            const x =
              type === 'stirred_tank'
                ? 140 + ((index * 13) % 60)
                : 145 + ((index * 9) % 50);

            const y =
              310 -
              ((index * 23 + rotationAngle) % 200);

            const radius = 2 + (index % 3);

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={radius}
                fill="#e0f2fe"
                opacity="0.65"
              />
            );
          })}

          {/* DO probe */}
          <g transform="translate(72, 160) rotate(18)">
            <rect
              x="0"
              y="0"
              width="12"
              height="110"
              rx="3"
              fill="#0284c7"
            />

            <circle
              cx="6"
              cy="108"
              r="4"
              fill="#38bdf8"
            />
          </g>

          {/* pH probe */}
          <g transform="translate(254, 160) rotate(-18)">
            <rect
              x="0"
              y="0"
              width="10"
              height="105"
              rx="3"
              fill="#10b981"
            />

            <circle
              cx="5"
              cy="103"
              r="4"
              fill="#6ee7b7"
            />
          </g>

          {/* Temperature probe */}
          <rect
            x="210"
            y="80"
            width="5"
            height="140"
            fill="#f59e0b"
            opacity="0.8"
          />
        </svg>

        {/* DO */}
        <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-bold">
            <Activity size={12} />
            Dissolved Oxygen
          </div>

          <div
            className={`text-sm font-mono font-bold mt-0.5 ${
              safeDO < 20
                ? 'text-rose-400'
                : safeDO < 40
                  ? 'text-amber-400'
                  : 'text-cyan-300'
            }`}
          >
            {safeDO.toFixed(1)}%
          </div>
        </div>

        {/* pH / Temperature */}
        <div className="absolute top-2 right-2 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold">
            Environment
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-emerald-300 font-mono text-xs">
              <Droplets size={12} />
              pH {safePH.toFixed(2)}
            </span>

            <span className="flex items-center gap-1 text-amber-300 font-mono text-xs">
              <Thermometer size={12} />
              {safeTemperature.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Biomass */}
        <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold">
            Biomass
          </div>

          <div className="text-sm text-slate-100 font-mono font-bold">
            {safeBiomass.toFixed(2)}
            <span className="text-[10px] text-slate-500 ml-1">
              g/L
            </span>
          </div>
        </div>

        {/* Oxygen transfer */}
        <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2">
          <div className="text-[10px] text-slate-500 uppercase font-bold">
            Oxygen Balance
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs font-mono">
            <span className="text-cyan-300">
              OTR {safeOTR.toFixed(1)}
            </span>

            <span className="text-slate-600">/</span>

            <span className="text-amber-300">
              OUR {safeOUR.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom information */}
      <div className="px-4 py-3 border-t border-slate-800">

        <div className="grid grid-cols-2 gap-3 mb-3">

          <div className="flex items-center gap-2">
            <Wind size={14} className="text-cyan-400" />

            <div>
              <div className="text-[10px] text-slate-500 uppercase">
                Aeration
              </div>

              <div className="text-xs font-mono text-slate-200">
                {safeAeration.toFixed(2)} vvm
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />

            <div>
              <div className="text-[10px] text-slate-500 uppercase">
                {type === 'stirred_tank'
                  ? 'Agitation'
                  : 'Circulation'}
              </div>

              <div className="text-xs font-mono text-slate-200">
                {type === 'stirred_tank'
                  ? `${safeAgitation.toFixed(0)} rpm`
                  : 'Pneumatic loop'}
              </div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between gap-3">

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Gauge size={13} />

            <span>
              Simulation state • 10 L working volume
            </span>
          </div>

          <button
            onClick={() =>
              onSelectType(
                type === 'stirred_tank'
                  ? 'airlift'
                  : 'stirred_tank'
              )
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[11px] font-semibold transition-colors"
          >
            Switch to{' '}
            {type === 'stirred_tank'
              ? 'Airlift'
              : 'Stirred Tank'}
          </button>

        </div>

        <div className="mt-2 text-[10px] text-slate-600">
          Visual representation of the simulated bioreactor state.
          No physical equipment is controlled by this interface.
        </div>

      </div>
    </div>
  );
};