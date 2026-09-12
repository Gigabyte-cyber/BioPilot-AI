/**
 * BIOPILOT AI - Mathematical Bioprocess Digital Twin
 *
 * Implements:
 * - Monod kinetics
 * - Yield coefficients
 * - Volumetric mass transfer coefficient (kLa)
 * - Oxygen Transfer Rate (OTR)
 * - Oxygen Uptake Rate (OUR)
 * - Bioreactor mechanics
 * - Controlled fed-batch feeding
 *
 * IMPORTANT:
 * This is a simulation/decision-support model.
 * It does not control physical bioreactor equipment.
 */

import { BioreactorType, ModelParameters, ProcessPoint } from '../types/bioprocess';
import { DEFAULT_PRODUCT, ProductProfile } from '../types/product';

export const DEFAULT_PARAMETERS: ModelParameters = {
  muMax: 0.48, // 1/h maximum specific growth rate
  Ks: 1.25, // g/L substrate saturation constant
  Yxs: 0.52, // g biomass / g substrate
  Ypx: 0.28, // g product / g biomass
  mS: 0.018, // g substrate / g biomass / h maintenance
  qO2Max: 7.8, // mmol O2 / g biomass / h maximum oxygen consumption
  mO: 0.35, // mmol O2 / g biomass / h maintenance oxygen
  Ko2: 0.015, // mmol/L oxygen saturation constant for growth limitation
  Cstar: 0.24, // mmol/L dissolved oxygen saturation at 37°C and 1 atm air
  targetTemp: 37.0, // °C
  targetPh: 7.00, // pH
};

/**
 * Calculates the volumetric oxygen mass transfer coefficient kLa (h^-1)
 * based on bioreactor geometry and operating variables.
 */
export function calculateKLa(
  type: BioreactorType,
  aeration: number,
  agitation: number
): number {
  if (type === 'stirred_tank') {
    // Adapted van 't Riet-style relationship:
    // kLa = c * (P/V)^a * (vs)^b

    const rpmNorm = Math.max(agitation, 50) / 250;
    const vvmNorm = Math.max(aeration, 0.1) / 1.0;

    const klaVal =
      32.0 *
      Math.pow(rpmNorm, 1.85) *
      Math.pow(vvmNorm, 0.65);

    return Math.min(Math.max(klaVal, 5.0), 320.0);
  } else {
    // Airlift bioreactor:
    // kLa depends primarily on superficial gas velocity.

    const vvmNorm = Math.max(aeration, 0.1) / 1.0;

    const klaVal =
      24.0 *
      Math.pow(vvmNorm, 0.82) *
      1.15;

    return Math.min(Math.max(klaVal, 4.0), 180.0);
  }
}

/**
 * Calculates environmental penalties for temperature and pH.
 */
function calculateEnvironmentalMultipliers(
  temp: number,
  ph: number,
  optTemp: number = 37.0,
  optPh: number = 7.0
): {
  tempFactor: number;
  phFactor: number;
} {
  const deltaT = Math.abs(temp - optTemp);

  const tempFactor = Math.max(
    0.05,
    1.0 - Math.pow(deltaT / 6.0, 2)
  );

  const deltaPh = Math.abs(ph - optPh);

  const phFactor = Math.max(
    0.05,
    1.0 - Math.pow(deltaPh / 1.4, 2)
  );

  return {
    tempFactor,
    phFactor,
  };
}

/**
 * Calculates instantaneous kinetic and oxygen-transfer variables.
 */
export function computeDerivatives(
  point: ProcessPoint,
  params: ModelParameters = DEFAULT_PARAMETERS,
  type: BioreactorType = 'stirred_tank',
  product: ProductProfile = DEFAULT_PRODUCT
): {
  mu: number;
  dXdt: number;
  dSdt: number;
  dPdt: number;
  dCLdt: number;
  otr: number;
  our: number;
  oxygenBalance: number;
  kla: number;
} {
  const {
    tempFactor,
    phFactor,
  } = calculateEnvironmentalMultipliers(
    point.temperature,
    point.ph,
    product.optimalTemp,
    product.optimalPh
  );

  // ------------------------------------------------------------
  // 1. Dissolved oxygen concentration
  // ------------------------------------------------------------

  const CL =
    (Math.max(0.0, point.do) / 100.0) *
    params.Cstar;

  // ------------------------------------------------------------
  // 2. Oxygen limitation factor
  // ------------------------------------------------------------

  const oxygenFactor =
    CL /
    (params.Ko2 + CL + 1e-6);

  // ------------------------------------------------------------
  // 3. Substrate limitation factor
  // ------------------------------------------------------------

  const safeSubstrate = Math.max(
    0,
    point.substrate
  );

  const substrateFactor =
    safeSubstrate /
    (params.Ks + safeSubstrate + 1e-6);

  // ------------------------------------------------------------
  // 4. Monod specific growth rate
  // ------------------------------------------------------------

  const mu =
    params.muMax *
    substrateFactor *
    oxygenFactor *
    tempFactor *
    phFactor;

  // ------------------------------------------------------------
  // 5. Cell lysis / decay
  //
  // Slightly higher decay when substrate is nearly depleted.
  // ------------------------------------------------------------

  const cellLysisRate =
    point.substrate < 0.2
      ? 0.015
      : 0.005;

  // ------------------------------------------------------------
  // 6. Biomass accumulation
  // ------------------------------------------------------------

  const dXdt =
    (mu - cellLysisRate) *
    point.biomass;

  // ------------------------------------------------------------
  // 7. Substrate consumption
  // ------------------------------------------------------------

  const dSdt =
    -(1.0 / params.Yxs) *
    Math.max(
      0,
      mu * point.biomass
    ) -
    params.mS *
    point.biomass;

  // ------------------------------------------------------------
  // 8. Product formation
  //
  // Luedeking-Piret:
  // dP/dt = alpha(muX) + betaX
  // ------------------------------------------------------------

  const alpha =
    product.luedekingPiret?.alpha ??
    params.Ypx;

  const beta =
    product.luedekingPiret?.beta ??
    0.02;

  const dPdt =
    Math.max(
      0.0,
      alpha *
        Math.max(
          0,
          mu * point.biomass
        ) +
        beta *
          point.biomass *
          oxygenFactor
    );

  // ------------------------------------------------------------
  // 9. kLa
  // ------------------------------------------------------------

  const kla = calculateKLa(
    type,
    point.aeration,
    point.agitation
  );

  // ------------------------------------------------------------
  // 10. Oxygen Transfer Rate
  //
  // OTR = kLa(C* - CL)
  // ------------------------------------------------------------

  const drivingForce = Math.max(
    0.0,
    params.Cstar - CL
  );

  const otr =
    kla *
    drivingForce;

  // ------------------------------------------------------------
  // 11. Oxygen Uptake Rate
  //
  // OUR = X(qO2 * mu + maintenance)
  // ------------------------------------------------------------

  const our =
    point.biomass *
    (
      mu * params.qO2Max +
      params.mO * oxygenFactor
    );

  // ------------------------------------------------------------
  // 12. Oxygen balance
  //
  // Positive = transfer exceeds demand
  // Negative = biological demand exceeds transfer
  // ------------------------------------------------------------

  const oxygenBalance =
    otr - our;

  // ------------------------------------------------------------
  // 13. Dissolved oxygen concentration derivative
  // ------------------------------------------------------------

  const dCLdt =
    oxygenBalance;

  return {
    mu,
    dXdt,
    dSdt,
    dPdt,
    dCLdt,
    otr,
    our,
    oxygenBalance,
    kla,
  };
}

/**
 * Performs one numerical integration step.
 *
 * The model uses a small adaptive-Euler-style timestep.
 */
export function stepSimulation(
  current: ProcessPoint,
  dt: number,
  params: ModelParameters = DEFAULT_PARAMETERS,
  type: BioreactorType = 'stirred_tank',
  disturbances?: {
    aerationMult?: number;
    agitationMult?: number;
    tempDrift?: number;
    phDrift?: number;
  },
  product: ProductProfile = DEFAULT_PRODUCT,
  maxBatchHours: number = 24.0
): ProcessPoint {
  // ------------------------------------------------------------
  // 1. Apply operating conditions / disturbances
  // ------------------------------------------------------------

  const effectiveAeration =
    current.aeration *
    (disturbances?.aerationMult ?? 1.0);

  const effectiveAgitation =
    current.agitation *
    (disturbances?.agitationMult ?? 1.0);

  const effectiveTemp =
    current.temperature +
    (disturbances?.tempDrift ?? 0.0);

  const effectivePh =
    current.ph +
    (disturbances?.phDrift ?? 0.0);

  const evaluationPoint: ProcessPoint = {
    ...current,
    aeration: effectiveAeration,
    agitation: effectiveAgitation,
    temperature: effectiveTemp,
    ph: effectivePh,
  };

  // ------------------------------------------------------------
  // 2. Calculate current process derivatives
  // ------------------------------------------------------------

  const k1 = computeDerivatives(
    evaluationPoint,
    params,
    type,
    product
  );

  // ------------------------------------------------------------
  // 3. Update biological states
  // ------------------------------------------------------------

  const newBiomass =
    Math.max(
      0.05,
      current.biomass +
        k1.dXdt * dt
    );

  let newSubstrate =
    Math.max(
      0.0,
      current.substrate +
        k1.dSdt * dt
    );

  const newProduct =
    Math.max(
      0.0,
      current.product +
        k1.dPdt * dt
    );

  // ------------------------------------------------------------
  // 4. Controlled fed-batch feeding
  //
  // IMPORTANT FIX:
  // Previously the model added 4.2 g/L at every 0.1 h step,
  // equivalent to approximately 42 g/L/h.
  //
  // The new model uses a controlled feed rate in g/L/h.
  // ------------------------------------------------------------

  let newVolume =
    current.volume;

  if (
    product.feedingStrategy === 'fed_batch' &&
    newSubstrate < 2.0 &&
    current.time < maxBatchHours - 2.0
  ) {
    // Conservative illustrative feed rate.
    const feedRate = 0.20; // g/L/h

    const feedAddition =
      feedRate * dt;

    newSubstrate +=
      feedAddition;

    // Small volume increase associated with feed.
    const volumeIncrease =
      0.002 * dt;

    newVolume = Math.min(
      12.5,
      Number(
        (
          current.volume +
          volumeIncrease
        ).toFixed(3)
      )
    );
  }

  // ------------------------------------------------------------
  // 5. Update dissolved oxygen
  //
  // dCL/dt = OTR - OUR
  // ------------------------------------------------------------

  const deltaDO =
    (
      k1.dCLdt *
      dt /
      params.Cstar
    ) *
    100.0;

  const newDO =
    Math.max(
      0.0,
      Math.min(
        100.0,
        current.do +
          deltaDO
      )
    );

  // ------------------------------------------------------------
  // 6. Update simulation time
  // ------------------------------------------------------------

  const nextTime =
    Number(
      (
        current.time +
        dt
      ).toFixed(2)
    );

  // ------------------------------------------------------------
  // 7. Construct next process point
  // ------------------------------------------------------------

  const nextPoint: ProcessPoint = {
    time: nextTime,

    biomass: Number(
      newBiomass.toFixed(3)
    ),

    substrate: Number(
      newSubstrate.toFixed(3)
    ),

    product: Number(
      newProduct.toFixed(3)
    ),

    do: Number(
      newDO.toFixed(1)
    ),

    ph: Number(
      effectivePh.toFixed(2)
    ),

    temperature: Number(
      effectiveTemp.toFixed(1)
    ),

    aeration: Number(
      effectiveAeration.toFixed(2)
    ),

    agitation:
      Math.round(
        effectiveAgitation
      ),

    specificGrowthRate:
      Number(
        k1.mu.toFixed(3)
      ),

    otr: Number(
      k1.otr.toFixed(2)
    ),

    our: Number(
      k1.our.toFixed(2)
    ),

    oxygenBalance:
      Number(
        k1.oxygenBalance.toFixed(2)
      ),

    kla: Number(
      k1.kla.toFixed(1)
    ),

    volume: newVolume,
  };

  return nextPoint;
}

/**
 * Creates the initial pristine process point at t = 0.
 */
export function createInitialProcessPoint(
  type: BioreactorType = 'stirred_tank',
  product: ProductProfile = DEFAULT_PRODUCT
): ProcessPoint {
  const initAeration = 1.0;

  const initAgitation =
    type === 'stirred_tank'
      ? (
          product.shearSensitivity === 'HIGH'
            ? 210
            : 250
        )
      : 150;

  const kla =
    calculateKLa(
      type,
      initAeration,
      initAgitation
    );

  return {
    time: 0.0,

    biomass:
      product.initialBiomass ??
      0.35,

    substrate:
      product.initialSubstrate ??
      24.0,

    product: 0.02,

    do: 98.5,

    ph:
      product.optimalPh ??
      7.00,

    temperature:
      product.optimalTemp ??
      37.0,

    aeration:
      initAeration,

    agitation:
      initAgitation,

    specificGrowthRate: 0.15,

    otr: 12.0,

    our: 1.8,

    oxygenBalance: 10.2,

    kla:
      Number(
        kla.toFixed(1)
      ),

    volume: 10.0,
  };
}

/**
 * Re-derives kinetic rates and oxygen-transfer variables
 * for a modified process point.
 */
export function calculateDerivedVariables(
  point: ProcessPoint,
  type: BioreactorType = 'stirred_tank',
  params: ModelParameters = DEFAULT_PARAMETERS,
  product: ProductProfile = DEFAULT_PRODUCT
): ProcessPoint {
  const deriv =
    computeDerivatives(
      point,
      params,
      type,
      product
    );

  return {
    ...point,

    specificGrowthRate:
      Number(
        deriv.mu.toFixed(3)
      ),

    otr:
      Number(
        deriv.otr.toFixed(2)
      ),

    our:
      Number(
        deriv.our.toFixed(2)
      ),

    oxygenBalance:
      Number(
        deriv.oxygenBalance.toFixed(2)
      ),

    kla:
      Number(
        deriv.kla.toFixed(1)
      ),
  };
}

/**
 * Single simulation step forward.
 */
export function integrateNextStep(
  current: ProcessPoint,
  dt: number,
  type: BioreactorType = 'stirred_tank',
  product: ProductProfile = DEFAULT_PRODUCT,
  maxBatchHours: number = 24.0
): ProcessPoint {
  return stepSimulation(
    current,
    dt,
    DEFAULT_PARAMETERS,
    type,
    undefined,
    product,
    maxBatchHours
  );
}

/**
 * Generates continuous simulation history up to target time.
 */
export function generateSimulationHistoryUpTo(
  targetTime: number = 5.8,
  type: BioreactorType = 'stirred_tank',
  aeration: number = 1.0,
  agitation?: number,
  params: ModelParameters = DEFAULT_PARAMETERS,
  product: ProductProfile = DEFAULT_PRODUCT,
  maxBatchHours: number = 24.0
): ProcessPoint[] {
  const points: ProcessPoint[] = [];

  let state =
    createInitialProcessPoint(
      type,
      product
    );

  // Apply requested operating conditions.
  state.aeration =
    aeration;

  const defaultAgit =
    type === 'stirred_tank'
      ? (
          product.shearSensitivity === 'HIGH'
            ? 210
            : 250
        )
      : 150;

  state.agitation =
    agitation ??
    defaultAgit;

  // Recalculate derived variables
  // after changing operating conditions.
  state =
    calculateDerivedVariables(
      state,
      type,
      params,
      product
    );

  points.push({
    ...state,
  });

  // 0.1 h = 6 minute resolution.
  const dt = 0.1;

  const clampedTarget =
    Math.min(
      targetTime,
      maxBatchHours
    );

  const steps =
    Math.max(
      1,
      Math.round(
        clampedTarget / dt
      )
    );

  for (
    let i = 1;
    i <= steps;
    i++
  ) {
    state =
      stepSimulation(
        state,
        dt,
        params,
        type,
        undefined,
        product,
        maxBatchHours
      );

    points.push({
      ...state,
    });
  }

  return points;
}