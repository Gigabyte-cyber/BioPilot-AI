/**
 * BIOPILOT AI - Agentic AI Engine & Explainability Architecture
 * Coordinates 9 specialized bioprocess agents, root-cause inference,
 * and evidence-based decision support with a mandatory Human Review Gate.
 */

import {
  AgentStep,
  CandidateIntervention,
  EvidenceScore,
  FermentationPhase,
  ProcessPoint,
  RiskAssessment,
  RootCauseAnalysis,
  TrajectoryMetrics,
} from '../types/bioprocess';

export function runRootCauseAnalysis(
  point: ProcessPoint,
  risk: RiskAssessment,
  trajectories: TrajectoryMetrics,
  phase: FermentationPhase
): RootCauseAnalysis {
  const { do: doTraj, oxygenBalance } = trajectories;

  if (point.do < 30.0 || point.oxygenBalance < 0.0) {
    const evidenceList = [
      `Dissolved oxygen is ${point.do.toFixed(1)}% (${doTraj.rateText}, trajectory ${doTraj.trend}).`,
      `Oxygen balance is negative (${point.oxygenBalance.toFixed(1)} mmol/L/h), meaning biological demand exceeds transfer.`,
      `Cell density is high (${point.biomass.toFixed(2)} g/L), producing rapid cellular respiration (OUR: ${point.our.toFixed(1)} mmol/L/h).`,
      `Volumetric transfer coefficient kLa (${point.kla.toFixed(1)} h⁻¹) is currently constrained by baseline agitation (${point.agitation} rpm) and aeration (${point.aeration.toFixed(1)} vvm).`,
    ];

    return {
      problem: 'Developing Oxygen-Transfer Limitation (Hypoxia Threat)',
      evidence: evidenceList,
      likelyContributingFactor:
        'Cellular oxygen demand (OUR) has scaled beyond the current physical oxygen transfer capacity (OTR) under baseline operating conditions.',
      alternativePossibilities: [
        'Biological broth viscosity increase hindering interfacial gas-liquid bubble coalescence.',
        'Sparger micro-orifice partial biofouling or line backpressure restriction.',
        'Metabolic respiration surge triggered by carbon substrate surge.',
      ],
      recommendedInvestigation:
        'Inspect sparger line pressure, verify dissolved oxygen probe calibration slope, and simulate agitation/aeration boost.',
      engineeringResponse:
        'Simulate candidate aeration (1.2–2.5 vvm) and agitation (250–400 rpm) interventions in the virtual bioreactor to determine optimal kLa enhancement.',
    };
  }

  if (point.temperature > 38.0 || point.temperature < 35.5) {
    return {
      problem: 'Thermal Regulation Excursion',
      evidence: [
        `Broth temperature (${point.temperature.toFixed(1)}°C) deviated from target 37.0°C by ${Math.abs(point.temperature - 37.0).toFixed(1)}°C.`,
        'Enzyme kinetics and Monod maximum growth rate subject to thermal deactivation.',
      ],
      likelyContributingFactor:
        'Cooling jacket valve position sticking or secondary chiller coolant supply temperature fluctuation.',
      alternativePossibilities: [
        'High metabolic heat dissipation during peak exponential phase.',
        'PT100 resistance thermometer lead drift or calibration offset.',
      ],
      recommendedInvestigation:
        'Check cooling water supply pressure, thermal actuator feedback, and secondary probe verification.',
      engineeringResponse:
        'Trigger PID tuning check on thermal jacket valve; trim agitation if mechanical dissipation is excessive.',
    };
  }

  if (point.ph < 6.6 || point.ph > 7.4) {
    return {
      problem: 'Broth pH Drift Outside Physiological Envelope',
      evidence: [
        `Broth pH is ${point.ph.toFixed(2)}, drifting away from neutral target 7.00.`,
        'Organic acid secretion or ammonia depletion occurring in the medium.',
      ],
      likelyContributingFactor:
        'Metabolic acid generation during active nutrient catabolism exceeding media buffering capacity.',
      alternativePossibilities: [
        'Acid/base pump tubing wear or reagent container depletion.',
        'Combination pH electrode diaphragm clogging with biomass residue.',
      ],
      recommendedInvestigation:
        'Inspect reagent pump tubing, verify fluid flow at dosing nozzles, and perform sample off-line blood-gas/pH meter check.',
      engineeringResponse:
        'Adjust automated titration pulse frequency or verify base reservoir inventory.',
    };
  }

  if (phase === 'Batch Endpoint' || point.substrate < 0.5) {
    return {
      problem: 'Carbon Substrate Exhaustion (Approaching Harvest Endpoint)',
      evidence: [
        `Substrate concentration has dropped to ${point.substrate.toFixed(2)} g/L.`,
        `Specific growth rate has declined to ${point.specificGrowthRate.toFixed(3)} h⁻¹.`,
      ],
      likelyContributingFactor:
        'Batch cycle has consumed available initial glucose/carbon inventory according to expected stoichiometric yield (Yx/s = 0.52).',
      alternativePossibilities: [
        'Unintended feed interruption if intended as fed-batch.',
      ],
      recommendedInvestigation:
        'Sample for final product titer verification and cell viability assay.',
      engineeringResponse:
        'Prepare downstream harvest or schedule fed-batch dosing pulse if batch extension is targeted.',
    };
  }

  // Nominal / Healthy state
  return {
    problem: 'Process Parameters Within Acceptable Limits',
    evidence: [
      `Dissolved oxygen (${point.do.toFixed(1)}%) within preferred 30-65% envelope.`,
      `Oxygen balance positive (+${point.oxygenBalance.toFixed(1)} mmol/L/h).`,
      `pH (${point.ph.toFixed(2)}) and temperature (${point.temperature.toFixed(1)}°C) tightly controlled.`,
    ],
    likelyContributingFactor:
      'Nutrient mass transfer and gas-liquid exchange are currently in equilibrium with cellular metabolic turnover.',
    alternativePossibilities: [],
    recommendedInvestigation: 'Continue automated passive trajectory logging.',
    engineeringResponse: 'Maintain current steady-state operational setpoints.',
  };
}

/**
 * Calculates evidence score (0-5 scale) without fabricating machine-learning percentages
 */
export function calculateEvidenceScore(
  point: ProcessPoint,
  trajectories: TrajectoryMetrics,
  risk: RiskAssessment
): EvidenceScore {
  const items = [
    {
      id: 'do_level',
      label: 'DO tension level supports diagnosis',
      supported: point.do < 30.0 || point.do > 75.0,
      metric: `DO: ${point.do.toFixed(1)}%`,
      detail: point.do < 30.0 ? 'Below preferred 30% threshold' : 'Optimal or high saturation',
    },
    {
      id: 'oxygen_balance',
      label: 'Oxygen balance (OTR - OUR) confirms transfer deficit',
      supported: point.oxygenBalance < 0.0,
      metric: `Balance: ${point.oxygenBalance.toFixed(1)} mmol/L/h`,
      detail: point.oxygenBalance < 0.0 ? 'Cellular demand strictly exceeds transfer rate' : 'Positive balance',
    },
    {
      id: 'do_trend',
      label: 'DO multi-point trajectory indicates persistent decline',
      supported: trajectories.do.trend === 'DECREASING' || trajectories.do.trend === 'RAPIDLY DECREASING',
      metric: `Rate: ${trajectories.do.rateText}`,
      detail: trajectories.do.interpretation,
    },
    {
      id: 'growth_rate',
      label: 'Specific growth rate confirms active cellular respiration',
      supported: point.specificGrowthRate > 0.15,
      metric: `μ = ${point.specificGrowthRate.toFixed(2)} h⁻¹`,
      detail: point.specificGrowthRate > 0.15 ? 'Active metabolic state producing high demand' : 'Low metabolic state',
    },
    {
      id: 'biomass_accumulation',
      label: 'Biomass trajectory reflects escalating oxygen consumption',
      supported: trajectories.biomass.trend === 'INCREASING' || trajectories.biomass.trend === 'RAPIDLY INCREASING',
      metric: `dX/dt: ${trajectories.biomass.rateText}`,
      detail: trajectories.biomass.interpretation,
    },
  ];

  const score = items.filter((i) => i.supported).length;

  let classification: EvidenceScore['classification'] = 'Low Evidence';
  if (score >= 4) classification = 'High Evidence';
  else if (score >= 2) classification = 'Moderate Evidence';

  return {
    score,
    maxScore: 5,
    classification,
    items,
  };
}

/**
 * Builds the 9-Agent State Sequence for the closed-loop decision workflow
 */
export function buildAgentWorkflow(
  point: ProcessPoint,
  phase: FermentationPhase,
  risk: RiskAssessment,
  rootCause: RootCauseAnalysis,
  bestIntervention: CandidateIntervention | null,
  evidence: EvidenceScore
): AgentStep[] {
  const isHealthy = risk.overallLevel === 'NORMAL';
  const hasRisk = risk.overallLevel === 'WARNING' || risk.overallLevel === 'CRITICAL';

  return [
    {
      id: 1,
      name: 'Process Monitor',
      role: 'Telemetry & Ingestion',
      status: 'completed',
      summary: `Streamed t=${point.time.toFixed(1)}h states. DO: ${point.do.toFixed(1)}%, X: ${point.biomass.toFixed(2)} g/L, pH: ${point.ph.toFixed(2)}.`,
      evidence: 'Sensory bus active; 12 bioprocess variables continuously acquired.',
    },
    {
      id: 2,
      name: 'Phase Analyst',
      role: 'Kinetic Regime Detection',
      status: 'completed',
      summary: `Identified regime: ${phase}.`,
      evidence: `Trajectory evaluated across 10 sample points (Biomass: ${point.biomass.toFixed(2)} g/L, μ: ${point.specificGrowthRate.toFixed(2)} h⁻¹).`,
    },
    {
      id: 3,
      name: 'Risk Analyst',
      role: 'Threshold & Trajectory Safety',
      status: isHealthy ? 'completed' : 'alert',
      summary: `Process Risk: ${risk.overallLevel}. Primary Concern: ${risk.primaryConcern}.`,
      evidence: `${risk.parameters.filter((p) => p.level !== 'NORMAL').length} parameter(s) flagged outside optimal physiological boundaries.`,
    },
    {
      id: 4,
      name: 'Root-Cause Analyst',
      role: 'Engineering Diagnostics',
      status: 'completed',
      summary: rootCause.problem,
      evidence: rootCause.likelyContributingFactor,
    },
    {
      id: 5,
      name: 'Intervention Simulator',
      role: 'Virtual Bioreactor Sandbox',
      status: hasRisk ? 'completed' : 'pending',
      summary: hasRisk ? 'Simulated forward trajectory across 25 candidate operating matrices.' : 'Standby — Process within nominal envelope.',
      evidence: hasRisk ? 'Evaluated 2.5-hour projection window with Monod and kLa differential equations.' : 'No intervention needed.',
    },
    {
      id: 6,
      name: 'Optimizer',
      role: 'Multi-Objective Ranking',
      status: bestIntervention ? 'completed' : 'pending',
      summary: bestIntervention
        ? `Ranked candidate #1: Aeration ${bestIntervention.aeration} vvm, Agitation ${bestIntervention.agitation} rpm.`
        : 'Standby.',
      evidence: bestIntervention
        ? `Projected DO recovery to ${(bestIntervention.projectedDO ?? 0).toFixed(1)}% (Composite Score: ${bestIntervention.compositeScore}).`
        : 'Awaiting simulation triggers.',
    },
    {
      id: 7,
      name: 'Explainability Agent',
      role: 'Scientific Rationale & Verification',
      status: 'completed',
      summary: `Evidence Classification: ${evidence.classification} (${evidence.score}/${evidence.maxScore} indicators satisfied).`,
      evidence: evidence.items.filter((i) => i.supported).map((i) => i.label).join('; ') || 'Nominal baseline indicators satisfied.',
    },
    {
      id: 8,
      name: 'Decision Agent',
      role: 'Formulation of Action Plan',
      status: 'completed',
      summary: hasRisk && bestIntervention
        ? `Formulated action: Increase aeration to ${bestIntervention.aeration} vvm and agitation to ${bestIntervention.agitation} rpm.`
        : 'Formulated action: Continue automated passive trajectory monitoring.',
      evidence: 'Generated deterministic engineering directive with projected biological yield impact.',
    },
    {
      id: 9,
      name: 'Human Review Gate',
      role: 'Process-Engineer Authorization',
      status: hasRisk ? 'alert' : 'completed',
      summary: hasRisk
        ? 'MANDATORY HUMAN APPROVAL REQUIRED: Real equipment cannot be altered without qualified process-engineer sign-off.'
        : 'Process nominal. Operator intervention gate clear.',
      evidence: 'Audit compliance standard: IEC 62304 / GAMP 5 Human-in-the-Loop decision verification.',
    },
  ];
}
