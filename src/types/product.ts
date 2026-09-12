/**
 * BIOPILOT AI - Product Catalog & Bioprocess Specification Types
 * Supports flexible batch duration up to 48 hours for any biopharmaceutical,
 * industrial enzyme, biofuel, organic acid, or custom user-defined product.
 */

export type ProductTypeCategory =
  | 'Biopharmaceutical'
  | 'Industrial Enzyme'
  | 'Biofuel & Biochemical'
  | 'Organic Acid / Primary Metabolite'
  | 'Secondary Metabolite'
  | 'Custom Synthesis';

export type ShearSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';
export type FeedingStrategy = 'batch' | 'fed_batch';

export interface ProductProfile {
  id: string;
  name: string;
  shortName: string;
  category: ProductTypeCategory;
  hostOrganism: string;
  description: string;
  // Flexible Batch Duration (up to 48 hours)
  defaultBatchHours: number; // e.g. 48.0
  maxBatchHours: number; // 48.0
  // Kinetic parameters
  targetYieldYpx: number; // g product / g biomass
  luedekingPiret: {
    alpha: number; // growth-associated parameter (g product / g biomass)
    beta: number; // non-growth associated parameter (g product / g biomass / h)
  };
  initialSubstrate: number; // g/L initial glucose/carbon
  initialBiomass: number; // g/L initial inoculum
  criticalDO: number; // % DO minimum safe threshold
  optimalDO: number; // % DO target
  shearSensitivity: ShearSensitivity; // Sensitivity to impeller tip speed / rpm
  maxRecommendedRpm: number; // rpm threshold before shear damage
  optimalTemp: number; // °C
  optimalPh: number; // pH
  feedingStrategy: FeedingStrategy;
  unit: string; // e.g. 'g/L' or 'mg/L'
}

export interface LiveRiskEvent {
  id: string;
  timeHour: number;
  level: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  parameter: string;
  currentValue: number;
  threshold: string;
  unit: string;
  message: string;
  physicalCause: string;
  remedy: string;
  timestamp: string;
}

export const PRESET_PRODUCTS: ProductProfile[] = [
  {
    id: 'mab_igg1',
    name: 'Monoclonal Antibody (mAb IgG1)',
    shortName: 'mAb IgG1',
    category: 'Biopharmaceutical',
    hostOrganism: 'CHO-K1 (Mammalian Cell)',
    description: 'Therapeutic antibody production requiring gentle shear, tight oxygen control, and extended 48h fed-batch synthesis.',
    defaultBatchHours: 48.0,
    maxBatchHours: 48.0,
    targetYieldYpx: 0.38,
    luedekingPiret: { alpha: 0.12, beta: 0.038 },
    initialSubstrate: 28.0,
    initialBiomass: 0.30,
    criticalDO: 30.0,
    optimalDO: 45.0,
    shearSensitivity: 'HIGH',
    maxRecommendedRpm: 240,
    optimalTemp: 37.0,
    optimalPh: 7.05,
    feedingStrategy: 'fed_batch',
    unit: 'g/L',
  },
  {
    id: 'recombinant_insulin',
    name: 'Recombinant Human Insulin',
    shortName: 'rh-Insulin',
    category: 'Biopharmaceutical',
    hostOrganism: 'Escherichia coli BL21(DE3)',
    description: 'High-density prokaryotic expression. High respiratory coefficient, rapid growth, and heavy oxygen consumption across 48h.',
    defaultBatchHours: 48.0,
    maxBatchHours: 48.0,
    targetYieldYpx: 0.32,
    luedekingPiret: { alpha: 0.28, beta: 0.015 },
    initialSubstrate: 25.0,
    initialBiomass: 0.40,
    criticalDO: 20.0,
    optimalDO: 40.0,
    shearSensitivity: 'LOW',
    maxRecommendedRpm: 450,
    optimalTemp: 37.0,
    optimalPh: 6.95,
    feedingStrategy: 'fed_batch',
    unit: 'g/L',
  },
  {
    id: 'industrial_cellulase',
    name: 'Industrial Cellulase / Amylase',
    shortName: 'Cellulase',
    category: 'Industrial Enzyme',
    hostOrganism: 'Bacillus subtilis',
    description: 'Extracellular hydrolytic enzyme synthesis. Robust shear tolerance with prominent non-growth-associated stationary production over 48h.',
    defaultBatchHours: 48.0,
    maxBatchHours: 48.0,
    targetYieldYpx: 0.48,
    luedekingPiret: { alpha: 0.08, beta: 0.065 },
    initialSubstrate: 35.0,
    initialBiomass: 0.35,
    criticalDO: 25.0,
    optimalDO: 50.0,
    shearSensitivity: 'MEDIUM',
    maxRecommendedRpm: 360,
    optimalTemp: 37.5,
    optimalPh: 6.85,
    feedingStrategy: 'fed_batch',
    unit: 'g/L',
  },
  {
    id: 'biofuel_ethanol',
    name: 'Biofuel Ethanol (Bioethanol)',
    shortName: 'Bioethanol',
    category: 'Biofuel & Biochemical',
    hostOrganism: 'Saccharomyces cerevisiae',
    description: 'High substrate carbon flux fermentation with Crabtree metabolic shift and product inhibition monitoring over 48h.',
    defaultBatchHours: 48.0,
    maxBatchHours: 48.0,
    targetYieldYpx: 0.51,
    luedekingPiret: { alpha: 0.45, beta: 0.02 },
    initialSubstrate: 50.0,
    initialBiomass: 0.50,
    criticalDO: 10.0,
    optimalDO: 25.0,
    shearSensitivity: 'LOW',
    maxRecommendedRpm: 400,
    optimalTemp: 32.0,
    optimalPh: 5.60,
    feedingStrategy: 'batch',
    unit: 'g/L',
  },
  {
    id: 'citric_acid',
    name: 'Citric Acid / Organic Acid',
    shortName: 'Citric Acid',
    category: 'Organic Acid / Primary Metabolite',
    hostOrganism: 'Aspergillus niger',
    description: 'High aeration overflow metabolism requiring prolonged idiophase and dense carbon feeding over extended 48h cycle.',
    defaultBatchHours: 48.0,
    maxBatchHours: 48.0,
    targetYieldYpx: 0.65,
    luedekingPiret: { alpha: 0.10, beta: 0.085 },
    initialSubstrate: 45.0,
    initialBiomass: 0.35,
    criticalDO: 30.0,
    optimalDO: 55.0,
    shearSensitivity: 'MEDIUM',
    maxRecommendedRpm: 320,
    optimalTemp: 30.0,
    optimalPh: 6.50,
    feedingStrategy: 'fed_batch',
    unit: 'g/L',
  },
];

export const DEFAULT_PRODUCT: ProductProfile = PRESET_PRODUCTS[0]; // Monoclonal Antibody (mAb IgG1)
