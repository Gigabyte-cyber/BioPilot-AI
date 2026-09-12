/**
 * BIOPILOT AI - Deterministic Process Risk Engine
 * Evaluates physiological state against established biochemical engineering bounds.
 * No arbitrary numerical hallucinations: all evaluations stem from kinetic constraints.
 */

import { ParameterRisk, ProcessPoint, RiskAssessment, RiskLevel, TrajectoryMetrics } from '../types/bioprocess';
import { DEFAULT_PRODUCT, LiveRiskEvent, ProductProfile } from '../types/product';

export function evaluateProcessRisk(
  point: ProcessPoint,
  trajectories: TrajectoryMetrics,
  product: ProductProfile = DEFAULT_PRODUCT,
  maxBatchHours: number = 48.0
): RiskAssessment {
  const risks: ParameterRisk[] = [];

  // 1. Dissolved Oxygen (DO) - Product specific threshold
  const criticalDOThreshold = product.criticalDO ?? 20.0;
  const preferredMinDO = Math.max(30.0, criticalDOThreshold + 10.0);
  let doLevel: RiskLevel = 'NORMAL';
  let doReason = `Dissolved oxygen within physiological aerobic window (${preferredMinDO}% - 70%) for ${product.name}.`;
  let doRec = 'Maintain current baseline sparging and agitation rates.';

  if (point.do < criticalDOThreshold) {
    doLevel = 'CRITICAL';
    doReason = `Severe hypoxia alert: DO has dropped to ${point.do}%, below critical threshold (${criticalDOThreshold}%) for ${product.hostOrganism}. Cellular respiration stalled.`;
    doRec = 'Immediately boost aeration (vvm) or agitation (rpm) to recover kLa and restore positive oxygen balance.';
  } else if (point.do < preferredMinDO || trajectories.do?.trend === 'RAPIDLY DECREASING') {
    doLevel = 'WARNING';
    doReason = `Hypoxic trajectory developing: DO is ${point.do}% and decreasing (${trajectories.do?.rateText ?? 'negative slope'}).`;
    doRec = 'Prepare intervention: adjust sparger flow or impeller speed in virtual twin.';
  } else if (point.do > 85.0) {
    doLevel = 'WARNING';
    doReason = `High oxygen saturation (${point.do}%). Excessive power consumption and potential oxidative stress.`;
    doRec = 'Consider trimming agitation or sparging rate to conserve energy.';
  }

  risks.push({
    parameter: 'Dissolved Oxygen (DO)',
    value: point.do,
    unit: '%',
    preferredRange: `${preferredMinDO}% – 65.0%`,
    level: doLevel,
    reason: doReason,
    recommendation: doRec,
  });

  // 2. Oxygen Balance (OTR - OUR)
  let obLevel: RiskLevel = 'NORMAL';
  let obReason = 'Oxygen transfer rate (OTR) comfortably meets biological uptake demand (positive balance).';
  let obRec = 'Continue passive trajectory monitoring.';

  if (point.oxygenBalance < -4.0) {
    obLevel = 'CRITICAL';
    obReason = `Mass transfer deficit: cellular OUR exceeds interfacial OTR by ${Math.abs(point.oxygenBalance).toFixed(1)} mmol/L/h. Broth dissolved oxygen will rapidly collapse.`;
    obRec = 'Evaluate immediate kLa enhancement via agitation or oxygen-enriched sparging.';
  } else if (point.oxygenBalance < 0.0) {
    obLevel = 'WARNING';
    obReason = `Negative oxygen balance (${point.oxygenBalance.toFixed(1)} mmol/L/h). Consumption is outstripping transfer.`;
    obRec = 'Increase aeration airflow or agitation speed.';
  }

  risks.push({
    parameter: 'Oxygen Balance (OTR - OUR)',
    value: point.oxygenBalance,
    unit: 'mmol/L/h',
    preferredRange: '≥ 0.0 mmol/L/h',
    level: obLevel,
    reason: obReason,
    recommendation: obRec,
  });

  // 3. Impeller Shear Stress & Agitation Limits
  const maxSafeRpm = product.maxRecommendedRpm ?? 350;
  let shearLevel: RiskLevel = 'NORMAL';
  let shearReason = `Agitation (${point.agitation} rpm) is within hydrodynamic shear tolerance for ${product.hostOrganism}.`;
  let shearRec = 'Maintain agitation setpoint.';

  if (point.agitation > maxSafeRpm * 1.15) {
    shearLevel = 'CRITICAL';
    shearReason = `Excessive impeller tip shear: agitation (${point.agitation} rpm) severely exceeds safe limit (${maxSafeRpm} rpm) for shear-sensitive ${product.hostOrganism}. Risk of membrane shearing and cellular lysis.`;
    shearRec = `Lower agitation to ≤ ${maxSafeRpm} rpm and compensate kLa by increasing sparging aeration rate.`;
  } else if (point.agitation > maxSafeRpm) {
    shearLevel = 'WARNING';
    shearReason = `Elevated shear stress: agitation (${point.agitation} rpm) slightly exceeds recommended ceiling (${maxSafeRpm} rpm) for ${product.shortName}.`;
    shearRec = `Cap agitation at ${maxSafeRpm} rpm to prevent cellular damage.`;
  }

  risks.push({
    parameter: 'Impeller Shear Stress',
    value: point.agitation,
    unit: 'rpm',
    preferredRange: `≤ ${maxSafeRpm} rpm`,
    level: shearLevel,
    reason: shearReason,
    recommendation: shearRec,
  });

  // 4. Substrate (Carbon Feed) & Batch Progress
  let subLevel: RiskLevel = 'NORMAL';
  let subReason = `Carbon source available (${point.substrate.toFixed(1)} g/L) supporting product synthesis.`;
  let subRec = 'Feed dosing normal.';

  const isNearBatchEnd = point.time >= maxBatchHours - 1.5;
  if (point.substrate < 0.3) {
    if (isNearBatchEnd) {
      subLevel = 'ENDPOINT';
      subReason = `Batch completion reached at Hour ${point.time.toFixed(1)} of ${maxBatchHours}h. Substrate consumed (${point.substrate.toFixed(2)} g/L) and product titer maximized (${point.product.toFixed(2)} ${product.unit}).`;
      subRec = 'Initiate harvest protocol, chilled storage, and downstream clarification.';
    } else {
      subLevel = 'CRITICAL';
      subReason = `Premature substrate starvation at Hour ${point.time.toFixed(1)} of ${maxBatchHours}h (${point.substrate.toFixed(2)} g/L). Cell growth halting; cell viability threat.`;
      subRec = 'Initiate fed-batch nutrient dosing pulse (+5 g/L glucose).';
    }
  } else if (point.substrate < 1.8 && !isNearBatchEnd) {
    subLevel = 'WARNING';
    subReason = `Low carbon substrate (${point.substrate.toFixed(1)} g/L). Growth rate deceleration imminent.`;
    subRec = 'Schedule nutrient feed top-up to maintain exponential/production kinetics.';
  } else if (point.substrate > 60.0) {
    subLevel = 'WARNING';
    subReason = `High substrate concentration (${point.substrate.toFixed(1)} g/L). Osmotic shock and catabolite repression risk.`;
    subRec = 'Throttle incoming feed stream to avoid hyper-osmotic inhibition.';
  }

  risks.push({
    parameter: 'Substrate Feed (S)',
    value: point.substrate,
    unit: 'g/L',
    preferredRange: '2.5 – 35.0 g/L',
    level: subLevel,
    reason: subReason,
    recommendation: subRec,
  });

  // 5. Broth Temperature
  const optT = product.optimalTemp ?? 37.0;
  let tempLevel: RiskLevel = 'NORMAL';
  let tempReason = `Broth temperature (${point.temperature.toFixed(1)}°C) regulated at optimal target (${optT}°C).`;
  let tempRec = 'Thermoregulation cooling/heating jacket operating normally.';

  if (Math.abs(point.temperature - optT) > 2.0) {
    tempLevel = 'CRITICAL';
    tempReason = `Temperature excursion (${point.temperature.toFixed(1)}°C vs optimal ${optT}°C). Severe kinetic inhibition and denaturation risk.`;
    tempRec = 'Inspect cooling water valve and heating jacket PID loop.';
  } else if (Math.abs(point.temperature - optT) > 0.8) {
    tempLevel = 'WARNING';
    tempReason = `Temperature drift (${point.temperature.toFixed(1)}°C vs optimal ${optT}°C) outside tight regulation band.`;
    tempRec = 'Check thermal sensor calibration and heat exchanger circulation.';
  }

  risks.push({
    parameter: 'Broth Temperature',
    value: point.temperature,
    unit: '°C',
    preferredRange: `${(optT - 0.5).toFixed(1)}°C – ${(optT + 0.5).toFixed(1)}°C`,
    level: tempLevel,
    reason: tempReason,
    recommendation: tempRec,
  });

  // 6. Broth pH
  const optPh = product.optimalPh ?? 7.00;
  let phLevel: RiskLevel = 'NORMAL';
  let phReason = `Broth pH (${point.ph.toFixed(2)}) maintained at setpoint (${optPh.toFixed(2)}).`;
  let phRec = 'Acid/base titration dosing pumps in standby.';

  if (Math.abs(point.ph - optPh) > 0.6) {
    phLevel = 'CRITICAL';
    phReason = `Dangerous pH deviation (${point.ph.toFixed(2)} vs target ${optPh.toFixed(2)}). Membrane permeability and metabolic shutdown risk.`;
    phRec = 'Check acid/base dosing lines and verify pH sensor calibration.';
  } else if (Math.abs(point.ph - optPh) > 0.25) {
    phLevel = 'WARNING';
    phReason = `pH drift (${point.ph.toFixed(2)} vs target ${optPh.toFixed(2)}) caused by organic byproduct secretion.`;
    phRec = 'Engage base pump titration or increase buffer dosing rate.';
  }

  risks.push({
    parameter: 'Broth pH',
    value: point.ph,
    unit: 'pH',
    preferredRange: `${(optPh - 0.2).toFixed(2)} – ${(optPh + 0.2).toFixed(2)}`,
    level: phLevel,
    reason: phReason,
    recommendation: phRec,
  });

  // Determine overall severity
  let overallLevel: RiskLevel = 'NORMAL';
  let primaryConcern = `Stable ${product.shortName} Production`;

  if (risks.some((r) => r.level === 'CRITICAL')) {
    overallLevel = 'CRITICAL';
    const criticalRisk = risks.find((r) => r.level === 'CRITICAL')!;
    primaryConcern = criticalRisk.parameter;
  } else if (risks.some((r) => r.level === 'WARNING')) {
    overallLevel = 'WARNING';
    const warningRisk = risks.find((r) => r.level === 'WARNING')!;
    primaryConcern = warningRisk.parameter;
  } else if (isNearBatchEnd && point.substrate < 0.5) {
    overallLevel = 'ENDPOINT';
    primaryConcern = 'Batch Complete — Harvest Ready';
  }

  return {
    overallLevel,
    primaryConcern,
    parameters: risks,
    timestamp: point.time,
  };
}

/**
 * Extracts live risk alerts that can be logged and announced during simulation
 */
export function extractLiveRiskAlerts(
  point: ProcessPoint,
  risk: RiskAssessment,
  product: ProductProfile = DEFAULT_PRODUCT
): LiveRiskEvent[] {
  const alerts: LiveRiskEvent[] = [];

  risk.parameters.forEach((param, idx) => {
    if (param.level === 'CRITICAL' || param.level === 'WARNING') {
      alerts.push({
        id: `risk-${point.time.toFixed(1)}-${idx}`,
        timeHour: point.time,
        level: param.level,
        parameter: param.parameter,
        currentValue: param.value,
        threshold: param.preferredRange,
        unit: param.unit,
        message: `${param.level}: ${param.parameter} is ${param.value} ${param.unit} (Target: ${param.preferredRange})`,
        physicalCause: param.reason,
        remedy: param.recommendation,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  });

  return alerts;
}
