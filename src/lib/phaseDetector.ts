/**
 * BIOPILOT AI - Trajectory-Aware Fermentation Phase Detector
 * Analyzes multi-point time-series velocities across biomass, substrate, DO, and oxygen balance.
 */

import { FermentationPhase, PhaseAnalysis, ProcessPoint, TrajectoryMetrics } from '../types/bioprocess';

export function detectFermentationPhase(
  current: ProcessPoint,
  history: ProcessPoint[],
  trajectories: TrajectoryMetrics
): PhaseAnalysis {
  const { biomass, substrate, do: doTraj, growthRate, oxygenBalance } = trajectories;

  // Evaluation criteria flags
  const isEarlyTime = current.time < 1.5;
  const isBiomassLow = current.biomass < 0.6;
  const isBiomassGrowingFast = biomass.trend === 'RAPIDLY INCREASING' || (biomass.trend === 'INCREASING' && biomass.rate > 0.25);
  const isGrowthRateHigh = current.specificGrowthRate > 0.28;
  const isSubstratePlentiful = current.substrate > 8.0;
  const isSubstrateLow = current.substrate <= 2.5 && current.substrate > 0.4;
  const isSubstrateDepleted = current.substrate <= 0.4;
  const isOxygenNegative = current.oxygenBalance < -1.0;
  const isDODecliningFast = doTraj.trend === 'RAPIDLY DECREASING' || (doTraj.trend === 'DECREASING' && current.do < 35.0);
  const isGrowthDecelerating = growthRate.trend === 'DECREASING' || growthRate.trend === 'RAPIDLY DECREASING';
  const isBiomassPlateau = biomass.trend === 'STABLE';

  let currentPhase: FermentationPhase = 'Transition / Unclassified';
  let reasoning = '';
  let confidence: 'High Evidence' | 'Moderate Evidence' | 'Low Evidence' = 'Moderate Evidence';
  const indicators: { label: string; value: string; support: boolean }[] = [];

  // 1. Batch Endpoint
  if (isSubstrateDepleted && current.specificGrowthRate < 0.05) {
    currentPhase = 'Batch Endpoint';
    reasoning =
      'Substrate is exhausted (< 0.4 g/L) and specific growth rate has fallen to near-zero. Cellular division has arrested and final product accumulation has peaked.';
    confidence = 'High Evidence';
    indicators.push(
      { label: 'Substrate Exhaustion', value: `${current.substrate.toFixed(2)} g/L`, support: true },
      { label: 'Growth Velocity Arrest', value: `μ = ${current.specificGrowthRate.toFixed(3)} h⁻¹`, support: true },
      { label: 'Biomass Rate Stable', value: biomass.rateText, support: true }
    );
    return { currentPhase, confidence, reasoning, indicators };
  }

  // 2. Oxygen-Limited Growth
  // Key signature: oxygen balance is negative, DO is falling rapidly or already low, yet biomass is high and actively demanding oxygen
  if (isOxygenNegative && isDODecliningFast && current.biomass > 1.2 && !isSubstrateDepleted) {
    currentPhase = 'Oxygen-Limited Growth';
    reasoning =
      'Biomass respiration demand (OUR) has outpaced volumetric oxygen transfer capacity (OTR). Oxygen balance is strictly negative and DO is on a steep downward trajectory despite ample substrate.';
    confidence = 'High Evidence';
    indicators.push(
      { label: 'Oxygen Balance Deficit', value: `${current.oxygenBalance.toFixed(1)} mmol/L/h`, support: true },
      { label: 'DO Trajectory', value: `${current.do.toFixed(1)}% (${doTraj.rateText})`, support: true },
      { label: 'Biomass Metabolic Activity', value: `${current.biomass.toFixed(2)} g/L active`, support: true },
      { label: 'Substrate Availability', value: `${current.substrate.toFixed(1)} g/L remaining`, support: true }
    );
    return { currentPhase, confidence, reasoning, indicators };
  }

  // 3. Substrate-Limited Growth
  if (isSubstrateLow && isGrowthDecelerating && current.biomass > 1.5) {
    currentPhase = 'Substrate-Limited Growth';
    reasoning =
      'Carbon source is dropping below saturation constant Ks (1.25 g/L). Monod kinetics show growth decelerating due to substrate diffusion limitations rather than oxygen transfer.';
    confidence = 'High Evidence';
    indicators.push(
      { label: 'Carbon Limitation', value: `${current.substrate.toFixed(2)} g/L`, support: true },
      { label: 'Growth Deceleration', value: growthRate.rateText, support: true },
      { label: 'Active Biomass Inventory', value: `${current.biomass.toFixed(2)} g/L`, support: true }
    );
    return { currentPhase, confidence, reasoning, indicators };
  }

  // 4. Stationary / Production Phase
  if (isBiomassPlateau && current.biomass > 2.0 && current.product > 0.5) {
    currentPhase = 'Stationary / Production Phase';
    reasoning =
      'Biomass accumulation has plateaued while secondary metabolite/product accumulation continues. Net cellular division matches basal death rate.';
    confidence = 'Moderate Evidence';
    indicators.push(
      { label: 'Biomass Accumulation Rate', value: biomass.rateText, support: true },
      { label: 'Product Synthesis Rate', value: trajectories.product.rateText, support: true },
      { label: 'Stable DO Reservoir', value: `${current.do.toFixed(1)}%`, support: true }
    );
    return { currentPhase, confidence, reasoning, indicators };
  }

  // 5. Exponential Growth
  if (isBiomassGrowingFast && isGrowthRateHigh && isSubstratePlentiful) {
    currentPhase = 'Exponential Growth';
    reasoning =
      'Culture is dividing at near-maximum specific growth rate (μmax). Unconstrained nutrient availability with robust cellular yield and high metabolic turnover.';
    confidence = 'High Evidence';
    indicators.push(
      { label: 'Specific Growth Rate', value: `μ = ${current.specificGrowthRate.toFixed(2)} h⁻¹`, support: true },
      { label: 'Biomass Accumulation Velocity', value: biomass.rateText, support: true },
      { label: 'Carbon Feed Reservoir', value: `${current.substrate.toFixed(1)} g/L`, support: true },
      { label: 'Oxygen Balance', value: `${current.oxygenBalance.toFixed(1)} mmol/L/h`, support: current.oxygenBalance > 0 }
    );
    return { currentPhase, confidence, reasoning, indicators };
  }

  // 6. Lag Phase
  if (isEarlyTime && isBiomassLow && current.specificGrowthRate < 0.20) {
    currentPhase = 'Lag Phase';
    reasoning =
      'Inoculum cells are adapting enzymatic machinery to the media environment. Minimal division velocity with baseline oxygen consumption.';
    confidence = 'High Evidence';
    indicators.push(
      { label: 'Early Batch Elapsed Time', value: `${current.time.toFixed(1)} h`, support: true },
      { label: 'Inoculum Cell Density', value: `${current.biomass.toFixed(2)} g/L`, support: true },
      { label: 'Full Dissolved Oxygen', value: `${current.do.toFixed(1)}%`, support: true }
    );
    return { currentPhase, confidence, reasoning, indicators };
  }

  // 7. Active Growth / Transition
  currentPhase = 'Active Growth / Transition';
  reasoning =
    'Cellular culture is transitioning between kinetic regimes. Moderate biomass accumulation observed with dynamic oxygen and substrate flux.';
  confidence = 'Moderate Evidence';
  indicators.push(
    { label: 'Specific Growth Rate', value: `μ = ${current.specificGrowthRate.toFixed(2)} h⁻¹`, support: true },
    { label: 'Biomass Rate', value: biomass.rateText, support: true },
    { label: 'Substrate Status', value: `${current.substrate.toFixed(1)} g/L`, support: true }
  );

  return { currentPhase, confidence, reasoning, indicators };
}

export const classifyFermentationPhase = (
  current: ProcessPoint,
  trajectories: TrajectoryMetrics,
  history: ProcessPoint[] = []
): PhaseAnalysis => detectFermentationPhase(current, history, trajectories);

