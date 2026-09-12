/**
 * BIOPILOT AI - Trajectory Intelligence Engine
 * Evaluates process velocity, rates of change, and multi-point directional momentum.
 */

import { ProcessPoint, TrajectoryInfo, TrajectoryMetrics, TrajectoryTrend } from '../types/bioprocess';

function classifyTrend(rate: number, rapidThreshold: number, changeThreshold: number): TrajectoryTrend {
  if (rate >= rapidThreshold) return 'RAPIDLY INCREASING';
  if (rate >= changeThreshold) return 'INCREASING';
  if (rate <= -rapidThreshold) return 'RAPIDLY DECREASING';
  if (rate <= -changeThreshold) return 'DECREASING';
  return 'STABLE';
}

/**
 * Calculates finite difference trends over a trailing window (e.g., last 1.0 to 2.0 hours)
 */
export function calculateTrajectories(history: ProcessPoint[]): TrajectoryMetrics {
  if (history.length === 0) {
    throw new Error('History cannot be empty');
  }

  const current = history[history.length - 1];

  // Look back approx 1.0 hour or at least 3-5 sample steps if available
  const windowCount = Math.min(history.length, 10);
  const lookbackIndex = Math.max(0, history.length - windowCount);
  const previous = history[lookbackIndex];

  const dt = Math.max(0.05, current.time - previous.time);

  // Finite difference derivatives
  const dXdt = (current.biomass - previous.biomass) / dt;
  const dSdt = (current.substrate - previous.substrate) / dt;
  const dPdt = (current.product - previous.product) / dt;
  const dDOdt = (current.do - previous.do) / dt;
  const dGrdt = (current.specificGrowthRate - previous.specificGrowthRate) / dt;
  const dOBdt = (current.oxygenBalance - previous.oxygenBalance) / dt;

  // Biomass Trajectory
  const biomassTrend = classifyTrend(dXdt, 0.45, 0.08);
  let biomassInterpretation = 'Cellular population actively dividing and accumulating.';
  if (biomassTrend === 'STABLE') biomassInterpretation = 'Biomass growth arrested or in stationary plateau.';
  if (biomassTrend === 'DECREASING') biomassInterpretation = 'Cell lysis or population decline detected.';

  // Substrate Trajectory
  const substrateTrend = classifyTrend(dSdt, 0.5, 0.1);
  let substrateInterpretation = 'Carbon feed being actively metabolized at expected rates.';
  if (dSdt < -2.0) substrateInterpretation = 'Rapid carbon consumption matching high cellular demand.';
  if (current.substrate < 1.0) substrateInterpretation = 'Substrate near exhaustion; growth will arrest soon.';

  // Product Trajectory
  const productTrend = classifyTrend(dPdt, 0.15, 0.02);
  const productInterpretation = productTrend === 'INCREASING' || productTrend === 'RAPIDLY INCREASING'
    ? 'Product synthesis actively linked to metabolic turnover.'
    : 'Product accumulation plateauing or low.';

  // DO Trajectory
  const doTrend = classifyTrend(dDOdt, 8.0, 2.0);
  let doInterpretation = 'Dissolved oxygen tension stable within acceptable physiological window.';
  if (doTrend === 'DECREASING') doInterpretation = 'Oxygen tension declining as cellular respiration outpaces transfer.';
  if (doTrend === 'RAPIDLY DECREASING') doInterpretation = 'Severe oxygen depletion trajectory; mass transfer deficit imminent.';
  if (doTrend === 'INCREASING') doInterpretation = 'Dissolved oxygen recovering; respiration declining or aeration boosted.';

  // Specific Growth Rate Trajectory
  const grTrend = classifyTrend(dGrdt, 0.08, 0.015);
  let grInterpretation = 'Specific growth rate μ maintaining steady exponential vigor.';
  if (grTrend === 'DECREASING') grInterpretation = 'Growth velocity decelerating due to nutrient or oxygen resistance.';
  if (grTrend === 'RAPIDLY DECREASING') grInterpretation = 'Abrupt metabolic deceleration; investigate limiting substrate or shear.';

  // Oxygen Balance Trajectory
  const obTrend = classifyTrend(dOBdt, 3.0, 0.8);
  let obInterpretation = 'Transfer capacity exceeds biological uptake rate (OTR > OUR).';
  if (current.oxygenBalance < 0) {
    obInterpretation = obTrend === 'RAPIDLY DECREASING' || obTrend === 'DECREASING'
      ? 'Transfer deficit worsening (OUR significantly exceeding OTR).'
      : 'Transfer deficit persistent but stabilizing.';
  }

  const formatRate = (val: number, unit: string) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)} ${unit}`;
  };

  return {
    biomass: {
      trend: biomassTrend,
      rate: dXdt,
      rateText: formatRate(dXdt, 'g/L/h'),
      interpretation: biomassInterpretation,
    },
    substrate: {
      trend: substrateTrend,
      rate: dSdt,
      rateText: formatRate(dSdt, 'g/L/h'),
      interpretation: substrateInterpretation,
    },
    product: {
      trend: productTrend,
      rate: dPdt,
      rateText: formatRate(dPdt, 'g/L/h'),
      interpretation: productInterpretation,
    },
    do: {
      trend: doTrend,
      rate: dDOdt,
      rateText: formatRate(dDOdt, '%/h'),
      interpretation: doInterpretation,
    },
    growthRate: {
      trend: grTrend,
      rate: dGrdt,
      rateText: formatRate(dGrdt, 'h⁻²/h'),
      interpretation: grInterpretation,
    },
    oxygenBalance: {
      trend: obTrend,
      rate: dOBdt,
      rateText: formatRate(dOBdt, 'mmol/L/h²'),
      interpretation: obInterpretation,
    },
  };
}
