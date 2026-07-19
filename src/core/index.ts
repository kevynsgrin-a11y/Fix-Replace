/** Public surface of the RepairOrReplace calculation core. */
export * from './types.js';
export { calculateDecision } from './decision.js';
export type { DecisionOptions } from './decision.js';
export { getCatalog } from './catalog.js';
export { computeRul, fitWeibull, conditionalSurvival, medianRemainingYears } from './weibull.js';
export { computeRepairCost } from './repairCost.js';
export { computeEnergy } from './energy.js';
export { computeNpc } from './npc.js';
export { evaluateSafety } from './safety.js';
export { evaluateConfidence } from './confidence.js';
export { buildMonetization } from './monetization.js';
