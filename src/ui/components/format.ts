// Display formatting helpers.

import type { Cost } from "../../data/costs";
import { RESOURCE_LABEL, type ResourceType } from "../../domain/resources/resourceTypes";

const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];

/** Round small numbers; compact-format large ones (12.3K, 1.2M, 3.4B, …). */
export function fmt(n: number): string {
  const r = Math.round(n);
  const abs = Math.abs(r);
  if (abs < 10000) return String(r);
  const tier = Math.min(UNITS.length - 1, Math.floor(Math.log10(abs) / 3));
  const scaled = r / Math.pow(1000, tier);
  const text = scaled.toFixed(Math.abs(scaled) < 100 ? 1 : 0).replace(/\.0$/, "");
  return text + UNITS[tier];
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
