/** Public surface of the RepairOrReplace calculation core. */
export * from './types';
export { calculateDecision } from './decision';
export type { DecisionOptions } from './decision';
export { getCatalog } from './catalog';
export { computeRul, fitWeibull, conditionalSurvival, medianRemainingYears } from './weibull';
export { computeRepairCost } from './repairCost';
export { computeEnergy } from './energy';
export { computeNpc } from './npc';
export { evaluateSafety } from './safety';
export { evaluateConfidence } from './confidence';
export { buildMonetization } from './monetization';
