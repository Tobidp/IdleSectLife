// Display formatting helpers.

import type { Cost } from "../../data/costs";
import { RESOURCE_LABEL, type ResourceType } from "../../domain/resources/resourceTypes";

/** Round to an integer; thousands separators for large numbers. */
export function fmt(n: number): string {
  const r = Math.round(n);
  return Math.abs(r) >= 10000 ? r.toLocaleString("en-US") : String(r);
}

/** One decimal place. */
export function fmt1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** Cost as "Wood 30 · Stone 20". */
export function formatCost(cost: Cost): string {
  return (Object.keys(cost) as ResourceType[])
    .map((k) => `${RESOURCE_LABEL[k]} ${cost[k]}`)
    .join(" · ");
}

/** "Infinite" cap shown as ∞. */
export function fmtCap(cap: number): string {
  return cap === Infinity ? "∞" : fmt(cap);
}
