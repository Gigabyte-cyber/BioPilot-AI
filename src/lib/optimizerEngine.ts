/**
 * BIOPILOT AI - What-If Simulation Lab & Engineering Intervention Optimizer
 * Projects forward dynamic trajectories in the virtual twin and ranks multi-variable interventions.
 */

import {
  BioreactorType,
  CandidateIntervention,
  InterventionScenario,
  ProcessPoint,
  RiskLevel,
} from '../types/bioprocess';
import { DEFAULT_PARAMETERS, stepSimulation } from './bioprocessModel';
import { evaluateProcessRisk } from './riskEngine';
import { calculateTrajectories } from './trajectoryEngine';

/**
 * Projects the bioreactor forward from current point for `hoursAhead` with given operating settings
 */
export function projectForward(
  current: ProcessPoint,
  hoursAhead: number = 2.5,
  aeration: number,
  agitation: number,
  temperature: number,
  ph: number,
  substrateAdd: number = 0,
  type: BioreactorType = 'stirred_tank'
): { endPoint: ProcessPoint; trajectory: ProcessPoint[] } {
  const dt = 0.1;
  const steps = Math.round(hoursAhead / dt);

  let state: ProcessPoint = {
    ...current,
    aeration,
    agitation,
    temperature,
    ph,
    substrate: current.substrate + substrateAdd,
  };

  const trajectory: ProcessPoint[] = [{ ...state }];

  for (let i = 1; i <= steps; i++) {
    state = stepSimulation(state, dt, DEFAULT_PARAMETERS, type);
    trajectory.push({ ...state });
  }

  return { endPoint: state, trajectory };
}

/**
 * Evaluates a single What-If scenario against baseline projection
 */
export function evaluateWhatIfScenario(
  current: ProcessPoint,
  name: string,
  aeration: number,
  agitation: number,
  temperature: number,
  ph: number,
  substrateAdd: number = 0,
  type: BioreactorType = 'stirred_tank'
): InterventionScenario {
  // Baseline projection (current operating parameters kept unchanged)
  const baseline = projectForward(
    current,
    2.5,
    current.aeration,
    current.agitation,
    current.temperature,
    current.ph,
    0,
    type
  );

  // Intervention projection
  const intervention = projectForward(
    current,
    2.5,
    aeration,
    agitation,
    temperature,
    ph,
    substrateAdd,
    type
  );

  const baseTraj = calculateTrajectories(baseline.trajectory);
  const baseRisk = evaluateProcessRisk(baseline.endPoint, baseTraj);

  const intTraj = calculateTrajectories(intervention.trajectory);
  const intRisk = evaluateProcessRisk(intervention.endPoint, intTraj);

  const deltaDO = intervention.endPoint.do - baseline.endPoint.do;
  const deltaOTR = intervention.endPoint.otr - baseline.endPoint.otr;
  const deltaOUR = intervention.endPoint.our - baseline.endPoint.our;
  const deltaOxygenBalance = intervention.endPoint.oxygenBalance - baseline.endPoint.oxygenBalance;
  const deltaBiomass = intervention.endPoint.biomass - baseline.endPoint.biomass;
  const deltaProduct = intervention.endPoint.product - baseline.endPoint.product;

  let outcomeRating: InterventionScenario['outcomeRating'] = 'PARTIALLY IMPROVED';
  let explanation = '';

  if (intRisk.overallLevel === 'NORMAL' && baseRisk.overallLevel !== 'NORMAL') {
    outcomeRating = 'RESOLVED';
    explanation = `The intervention successfully resolved process risks. DO projected to stabilize at ${intervention.endPoint.do.toFixed(1)}% with a positive oxygen balance (+${intervention.endPoint.oxygenBalance.toFixed(1)} mmol/L/h).`;
  } else if (deltaOxygenBalance > 4.0 && intervention.endPoint.do > 20.0) {
    outcomeRating = 'IMPROVED';
    explanation = `Substantial improvement in mass transfer. Oxygen balance enhanced by +${deltaOxygenBalance.toFixed(1)} mmol/L/h and DO boosted by +${deltaDO.toFixed(1)}%.`;
  } else if (deltaOxygenBalance > 0.8 || deltaDO > 3.0) {
    outcomeRating = 'PARTIALLY IMPROVED';
    explanation = `Intervention provides modest oxygen relief (ΔDO +${deltaDO.toFixed(1)}%), but transfer capacity still encounters resistance under high cellular density.`;
  } else if (Math.abs(deltaDO) < 1.0 && Math.abs(deltaOxygenBalance) < 0.5) {
    outcomeRating = 'INEFFECTIVE';
    explanation = 'Intervention parameters produced negligible impact on oxygen mass transfer or yield.';
  } else {
    outcomeRating = 'WORSENED';
    explanation = `Intervention exacerbated process instability. Negative impact observed on DO (${deltaDO.toFixed(1)}%) or cellular yield.`;
  }

  return {
    id: `what-if-${Date.now()}`,
    name,
    aeration,
    agitation,
    temperature,
    ph,
    substrateAdd,
    projectedDO: intervention.endPoint.do,
    projectedOTR: intervention.endPoint.otr,
    projectedOUR: intervention.endPoint.our,
    projectedOxygenBalance: intervention.endPoint.oxygenBalance,
    projectedBiomass: intervention.endPoint.biomass,
    projectedProduct: intervention.endPoint.product,
    projectedRisk: intRisk.overallLevel,
    deltaDO: Number(deltaDO.toFixed(1)),
    deltaOTR: Number(deltaOTR.toFixed(1)),
    deltaOUR: Number(deltaOUR.toFixed(1)),
    deltaOxygenBalance: Number(deltaOxygenBalance.toFixed(1)),
    deltaBiomass: Number(deltaBiomass.toFixed(2)),
    deltaProduct: Number(deltaProduct.toFixed(2)),
    outcomeRating,
    explanation,
  };
}

/**
 * Searches and ranks candidate interventions across a discrete engineering parameter grid
 */
export function optimizeInterventions(
  current: ProcessPoint,
  type: BioreactorType = 'stirred_tank'
): CandidateIntervention[] {
  // Discrete candidate parameter space
  const aerationGrid = type === 'stirred_tank' ? [1.0, 1.2, 1.5, 2.0, 2.5] : [1.0, 1.4, 1.8, 2.2, 2.8];
  const agitationGrid = type === 'stirred_tank' ? [200, 250, 300, 350, 400] : [120, 160, 200, 240, 280];

  const candidates: CandidateIntervention[] = [];

  for (const aer of aerationGrid) {
    for (const agit of agitationGrid) {
      const projection = projectForward(
        current,
        2.0,
        aer,
        agit,
        current.temperature,
        current.ph,
        0,
        type
      );

      const traj = calculateTrajectories(projection.trajectory);
      const risk = evaluateProcessRisk(projection.endPoint, traj);

      // Operational penalty for high agitation (shear stress, energy) and excessive aeration (foaming)
      const agitPenalty = Math.max(0, agit - 250) * 0.08;
      const aerPenalty = Math.max(0, aer - 1.0) * 8.0;
      const operationalPenalty = Number((agitPenalty + aerPenalty).toFixed(1));

      // Scoring criteria:
      // 1. DO recovery towards optimal 40-50%
      const doScore = Math.max(0, 50 - Math.abs(projection.endPoint.do - 45.0));
      // 2. Oxygen balance positivity
      const obScore = Math.min(30, Math.max(-30, projection.endPoint.oxygenBalance * 4.0));
      // 3. Biomass retention
      const bioScore = projection.endPoint.biomass * 8.0;
      // 4. Risk penalty
      const riskPenalty = risk.overallLevel === 'CRITICAL' ? 60 : risk.overallLevel === 'WARNING' ? 20 : 0;

      const compositeScore = Number((doScore + obScore + bioScore - operationalPenalty - riskPenalty).toFixed(1));

      let rationale = '';
      if (risk.overallLevel === 'NORMAL') {
        rationale = `Optimal aerobic stability: Restores DO to ${projection.endPoint.do.toFixed(1)}% with +${projection.endPoint.oxygenBalance.toFixed(1)} mmol/L/h balance.`;
      } else if (risk.overallLevel === 'WARNING') {
        rationale = `Significant mass transfer improvement (DO ${projection.endPoint.do.toFixed(1)}%), moderate shear penalty.`;
      } else {
        rationale = `Mass transfer enhanced but high cell density still leaves residual hypoxia (DO ${projection.endPoint.do.toFixed(1)}%).`;
      }

      candidates.push({
        rank: 0,
        aeration: aer,
        agitation: agit,
        projectedDO: projection.endPoint.do,
        oxygenBalance: projection.endPoint.oxygenBalance,
        biomass: projection.endPoint.biomass,
        product: projection.endPoint.product,
        risk: risk.overallLevel,
        compositeScore,
        operationalPenalty,
        isBest: false,
        rationale,
      });
    }
  }

  // Sort descending by composite score
  candidates.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ranks
  candidates.forEach((c, idx) => {
    c.rank = idx + 1;
    if (idx === 0) c.isBest = true;
  });

  return candidates;
}
