import type {
  ApplianceCategory,
  BrandTier,
  NpcBreakdown,
  NpcResult,
} from './types.js';
import type { ReplacementAncillary } from '../data/ancillary.js';
import { getExpectedLifespanYears } from '../data/lifespans.js';

/**
 * Net Present Cost comparison, replace-now vs. repair-and-run.
 *
 * The two options have different service lives, so a naive "sum each over its
 * own lifespan" comparison is apples-to-oranges. We fix a common horizon H (the
 * expected lifespan of the new unit) and model equivalent service on both
 * paths:
 *
 *   Replace now:  buy new today; it reaches end-of-life exactly at H (residual 0).
 *   Repair:       run the repaired unit for its remaining useful life R_old; if
 *                 R_old < H, buy a replacement at year R_old and run it to H.
 *                 That replacement is only partly used at H, so the repair path
 *                 is credited its terminal residual value.
 *
 * All cash flows are discounted monthly at the macro discount rate (opportunity
 * cost of capital). Break-even is the first month at which the cumulative cost
 * of replacing-now falls at or below the cumulative cost of the repair path.
 */

export interface NpcInput {
  category: ApplianceCategory;
  tier: BrandTier;
  /** E[C_repair] — the risk-adjusted repair cost. */
  expectedRepairCost: number;
  annualOldEnergy: number;
  annualNewEnergy: number;
  newUnitPrice: number;
  ancillary: ReplacementAncillary;
  discountRate: number;
  /** Remaining useful life of the old unit, in years (Weibull median). */
  oldRemainingYears: number;
}

export function computeNpc(input: NpcInput): NpcResult {
  const {
    category,
    tier,
    expectedRepairCost,
    annualOldEnergy,
    annualNewEnergy,
    newUnitPrice,
    ancillary,
    discountRate,
    oldRemainingYears,
  } = input;

  const horizonYears = getExpectedLifespanYears(category, tier);
  const M = Math.max(1, Math.round(horizonYears * 12));
  const Mold = Math.min(M, Math.max(1, Math.round(oldRemainingYears * 12)));
  const hasMidReplacement = Mold < M;

  const rm = Math.pow(1 + discountRate, 1 / 12) - 1;
  const disc = (m: number) => 1 / Math.pow(1 + rm, m);

  const upfrontReplace =
    newUnitPrice + ancillary.install + ancillary.delivery + ancillary.disposal - ancillary.salvage;
  const upfrontRepair = expectedRepairCost;

  const monthlyOld = annualOldEnergy / 12;
  const monthlyNew = annualNewEnergy / 12;

  // Present value of the mid-horizon replacement capital outlay (repair path).
  const midReplacementPv = hasMidReplacement ? upfrontReplace * disc(Mold) : 0;

  // Terminal residual credit for the repair path's still-young replacement unit.
  // At horizon it has age (H - R_old); remaining life fraction = R_old / H.
  const residualFraction = hasMidReplacement
    ? Math.min(1, oldRemainingYears / horizonYears)
    : 0;
  const residualCredit = hasMidReplacement
    ? newUnitPrice * residualFraction * disc(M)
    : 0;

  let replaceEnergyPv = 0;
  let repairEnergyPv = 0;
  let breakEvenMonths: number | null = null;

  let cumReplace = upfrontReplace;
  let cumRepair = upfrontRepair;

  for (let m = 1; m <= M; m++) {
    const d = disc(m);
    replaceEnergyPv += monthlyNew * d;
    cumReplace = upfrontReplace + replaceEnergyPv;

    // Repair path: old unit energy until it is retired, then new-unit energy.
    const monthlyEnergy = m <= Mold ? monthlyOld : monthlyNew;
    repairEnergyPv += monthlyEnergy * d;
    // The mid-horizon replacement outlay lands once we pass its purchase month.
    const midOutlaySoFar = hasMidReplacement && m >= Mold ? midReplacementPv : 0;
    // Credit the terminal residual at the horizon month so the final-month
    // cumulative equals the reported repair total (keeps break-even consistent
    // with the NPC totals rather than the residual-inflated running sum).
    const residualAtHorizon = m === M ? residualCredit : 0;
    cumRepair = upfrontRepair + repairEnergyPv + midOutlaySoFar - residualAtHorizon;

    if (breakEvenMonths === null && cumReplace <= cumRepair) {
      breakEvenMonths = m;
    }
  }

  const replaceBreakdown: NpcBreakdown = {
    upfront: upfrontReplace,
    energyPresentValue: replaceEnergyPv,
    salvageCredit: 0,
    riskAdjustment: 0,
  };
  const repairBreakdown: NpcBreakdown = {
    upfront: upfrontRepair + midReplacementPv,
    energyPresentValue: repairEnergyPv,
    salvageCredit: residualCredit,
    riskAdjustment: 0,
  };

  const replace =
    replaceBreakdown.upfront +
    replaceBreakdown.energyPresentValue -
    replaceBreakdown.salvageCredit +
    replaceBreakdown.riskAdjustment;
  const repair =
    repairBreakdown.upfront +
    repairBreakdown.energyPresentValue -
    repairBreakdown.salvageCredit +
    repairBreakdown.riskAdjustment;

  const advantageOfReplacing = repair - replace;

  // Break-even must never contradict the full-horizon verdict: if repairing is
  // cheaper over the horizon, replacing does not "pull ahead" at any point, so
  // report no break-even rather than a misleading crossing from the running sum.
  const reconciledBreakEven = advantageOfReplacing >= 0 ? breakEvenMonths : null;

  return {
    horizonYears,
    discountRate,
    replace,
    repair,
    advantageOfReplacing,
    replaceBreakdown,
    repairBreakdown,
    breakEvenMonths: reconciledBreakEven,
  };
}
