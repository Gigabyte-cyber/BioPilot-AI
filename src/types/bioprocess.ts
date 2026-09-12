/**
 * BIOPILOT AI - Core Bioprocess Types & Interfaces
 * Agentic AI Digital Bioprocess Engineer
 */

export type BioreactorType = 'stirred_tank' | 'airlift';

export type FermentationPhase =
  | 'Lag Phase'
  | 'Exponential Growth'
  | 'Active Growth / Transition'
  | 'Oxygen-Limited Growth'
  | 'Substrate-Limited Growth'
  | 'Stationary / Production Phase'
  | 'Batch Endpoint'
  | 'Transition / Unclassified';

export type RiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'ENDPOINT';

export type TrajectoryTrend =
  | 'RAPIDLY INCREASING'
  | 'INCREASING'
  | 'STABLE'
  | 'DECREASING'
  | 'RAPIDLY DECREASING';

export interface ProcessPoint {
  time: number; // hours
  biomass: number; // g/L (X)
  substrate: number; // g/L (S)
  product: number; // g/L (P)
  do: number; // % saturation (CL)
  ph: number; // pH units
  temperature: number; // °C
  aeration: number; // vvm
  agitation: number; // rpm (stirred tank) or equivalent sparge velocity
  specificGrowthRate: number; // 1/h (mu)
  otr: number; // mmol O2/L/h
  our: number; // mmol O2/L/h
  oxygenBalance: number; // mmol O2/L/h (OTR - OUR)
  kla: number; // 1/h
  volume: number; // L
}

export interface ModelParameters {
  muMax: number; // 1/h
  Ks: number; // g/L
  Yxs: number; // g biomass / g substrate
  Ypx: number; // g product / g biomass
  mS: number; // maintenance substrate coefficient g/g/h
  qO2Max: number; // mmol O2 / g biomass / h
  mO: number; // maintenance oxygen demand mmol O2 / g biomass / h
  Ko2: number; // mmol/L oxygen affinity constant
  Cstar: number; // mmol/L oxygen saturation (approx 0.25 mmol/L at 37°C)
  targetTemp: number; // °C (37.0)
  targetPh: number; // 7.0
}

export interface ParameterRisk {
  parameter: string;
  value: number;
  unit: string;
  preferredRange: string;
  level: RiskLevel;
  reason: string;
  recommendation: string;
}

export interface RiskAssessment {
  overallLevel: RiskLevel;
  primaryConcern: string;
  parameters: ParameterRisk[];
  timestamp: number;
}

export interface TrajectoryInfo {
  trend: TrajectoryTrend;
  rate: number;
  rateText: string;
  interpretation: string;
}

export interface TrajectoryMetrics {
  biomass: TrajectoryInfo;
  substrate: TrajectoryInfo;
  product: TrajectoryInfo;
  do: TrajectoryInfo;
  growthRate: TrajectoryInfo;
  oxygenBalance: TrajectoryInfo;
}

export interface PhaseAnalysis {
  currentPhase: FermentationPhase;
  confidence: 'High Evidence' | 'Moderate Evidence' | 'Low Evidence';
  reasoning: string;
  indicators: {
    label: string;
    value: string;
    support: boolean;
  }[];
}

export interface RootCauseAnalysis {
  problem: string;
  evidence: string[];
  likelyContributingFactor: string;
  alternativePossibilities: string[];
  recommendedInvestigation: string;
  engineeringResponse: string;
}

export interface InterventionScenario {
  id: string;
  name: string;
  aeration: number;
  agitation: number;
  temperature: number;
  ph: number;
  substrateAdd: number;
  projectedDO: number;
  projectedOTR: number;
  projectedOUR: number;
  projectedOxygenBalance: number;
  projectedBiomass: number;
  projectedProduct: number;
  projectedRisk: RiskLevel;
  deltaDO: number;
  deltaOTR: number;
  deltaOUR: number;
  deltaOxygenBalance: number;
  deltaBiomass: number;
  deltaProduct: number;
  outcomeRating: 'RESOLVED' | 'IMPROVED' | 'PARTIALLY IMPROVED' | 'INEFFECTIVE' | 'WORSENED';
  explanation: string;
}

export interface CandidateIntervention {
  rank: number;
  aeration: number;
  agitation: number;
  projectedDO: number;
  oxygenBalance: number;
  biomass: number;
  product: number;
  risk: RiskLevel;
  compositeScore: number;
  operationalPenalty: number;
  isBest: boolean;
  rationale: string;
}

export interface EvidenceItem {
  id: string;
  label: string;
  supported: boolean;
  metric: string;
  detail: string;
}

export interface EvidenceScore {
  score: number; // 0-5
  maxScore: number;
  classification: 'High Evidence' | 'Moderate Evidence' | 'Low Evidence';
  items: EvidenceItem[];
}

export interface AgentStep {
  id: number;
  name: string;
  role: string;
  status: 'pending' | 'running' | 'completed' | 'alert';
  summary: string;
  evidence?: string;
  timestamp?: string;
}

export interface ProcessMemoryItem {
  id: string;
  timeHours: number;
  timestamp: string;
  phase: FermentationPhase;
  riskLevel: RiskLevel;
  primaryConcern: string;
  recommendation: string;
  interventionCandidate?: string;
  simulatedOutcome: string;
  engineerApproval: 'REQUIRED' | 'APPROVED' | 'REJECTED';
  engineerNotes?: string;
}

export interface EngineeringDisturbance {
  id: string;
  title: string;
  category: string;
  description: string;
  aerationFactor?: number;
  agitationFactor?: number;
  tempDelta?: number;
  phDelta?: number;
  substrateDelta?: number;
  oxygenLimitationBoost?: boolean;
}
