import type {
  ApplianceCategory,
  BrandTier,
  NpcBreakdown,
  NpcResult,
} from './types';
import type { ReplacementAncillary } from '../data/ancillary';
import { getExpectedLifespanYears } from '../data/lifespans';

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

  // Clamp rather than trust the caller: a rate of -100% makes the monthly
  // factor -1 and every discount factor Infinity/NaN, which would serialize as
  // null and surface as "$—" instead of failing loudly.
  const safeRate = Number.isFinite(discountRate) ? Math.min(0.5, Math.max(0, discountRate)) : 0.05;
  const rm = Math.pow(1 + safeRate, 1 / 12) - 1;
  const disc = (m: number) => 1 / Math.pow(1 + rm, m);

  const upfrontReplace =
    newUnitPrice + ancillary.install + ancillary.delivery + ancillary.disposal - ancillary.salvage;
  const upfrontRepair = expectedRepairCost;

  const monthlyOld = annualOldEnergy / 12;
  const monthlyNew = annualNewEnergy / 12;

  // Present value of the mid-horizon replacement capital outlay (repair path).
  const midReplacementPv = upfrontReplace * disc(Mold);

  // Terminal residual credit for the repair path's still-young replacement unit.
  // It is bought at month Mold and used for (M - Mold) of its M-month life, so
  // the fraction still unused at the horizon is Mold/M.
  //
  // The credit prorates the WHOLE installed capital outlay, not just the bare
  // unit price. Crediting only the unit price while charging the ancillaries in
  // full made the repair path jump discontinuously as the old unit's remaining
  // life approached the horizon: a replacement bought for the last sliver of the
  // horizon was charged full install/delivery/disposal it never got to use. That
  // step was large enough (up to +89% of the repair total) to flip the verdict on
  // a one-year change in age. Prorating the full outlay makes the capital block
  // tend to zero smoothly as Mold -> M, so the two paths stay comparable.
  const residualFraction = Mold / M;
  const residualCredit = upfrontReplace * residualFraction * disc(M);

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
    const midOutlaySoFar = m >= Mold ? midReplacementPv : 0;
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
    // Report the rate actually applied, so the UI never displays a rate the
    // math didn't use.
    discountRate: safeRate,
    replace,
    repair,
    advantageOfReplacing,
    replaceBreakdown,
    repairBreakdown,
    breakEvenMonths: reconciledBreakEven,
  };
}
