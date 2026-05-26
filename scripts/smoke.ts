// Headless smoke test: run a year of simulation and assert invariants.
// Bundled with esbuild and run under Node (no DOM needed — domain logic is DOM-free).

import { Rng } from "../src/core/rng/rng";
import { createNewGame } from "../src/state/gameState";
import { advanceDay } from "../src/domain/simulation/advanceDay";
import { warehouseCap } from "../src/domain/resources/resources";
import { disciplesCapacity } from "../src/domain/buildings/buildings";
import { upgradePavilion } from "../src/domain/buildings/buildings";
import { STORABLE_RESOURCES } from "../src/domain/resources/resourceTypes";
import { effectiveLevel, createAttr, addXp } from "../src/domain/disciples/attributes";
import { rankName } from "../src/data/progression";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  }
}

const rng = new Rng(12345);
const state = createNewGame("sword", rng);
console.log(`Start: sect=${state.sect.type} disciples=${state.disciples.length} cap=${disciplesCapacity(state)}`);

const DAYS = 360; // one year
for (let i = 0; i < DAYS; i++) {
  advanceDay(state, rng);
  state.rngSeed = rng.state;

  // Occasionally upgrade quarters so recruitment isn't capacity-locked.
  if (i === 60 || i === 180) upgradePavilion(state, "quarters");

  // Invariants every day:
  for (const r of STORABLE_RESOURCES) {
    const v = state.resources[r];
    check(Number.isFinite(v), `resource ${r} finite (got ${v}) on day ${i}`);
    check(v >= 0, `resource ${r} >= 0 (got ${v}) on day ${i}`);
    check(v <= warehouseCap(state.buildings.warehouse.level) + 1e-6, `resource ${r} within cap on day ${i}`);
  }
  check(Number.isFinite(state.fame) && state.fame >= 0, `fame valid (got ${state.fame}) on day ${i}`);
  check(state.disciples.length <= disciplesCapacity(state), `disciples within capacity on day ${i}`);
  for (const d of state.disciples) {
    check(d.happiness >= 0 && d.happiness <= 100, `${d.name} happiness in range (got ${d.happiness})`);
    check(d.hp >= 0, `${d.name} hp >= 0 (got ${d.hp})`);
    const str = d.attributes.strength;
    check(Number.isFinite(effectiveLevel(str)), `${d.name} strength level finite`);
    check(str.star >= 1 && str.star <= 10, `${d.name} strength star in 1..10 (got ${str.star})`);
    check(str.rank >= 0, `${d.name} strength rank >= 0 (got ${str.rank})`);
  }
}

const sample = state.disciples[0];
console.log(`\nAfter ${DAYS} days (Y${state.time.year} M${state.time.month} D${state.time.day}):`);
console.log(`  disciples: ${state.disciples.length} / ${disciplesCapacity(state)}`);
console.log(`  fame: ${state.fame.toFixed(1)}`);
console.log(`  resources:`, Object.fromEntries(Object.entries(state.resources).map(([k, v]) => [k, Math.round(v)])));
console.log(`  warehouse cap: ${warehouseCap(state.buildings.warehouse.level)}`);
console.log(`  log entries: ${state.log.length}`);
if (sample) {
  const s = sample.attributes.strength;
  console.log(`  sample ${sample.name}: STR ${rankName(s.rank)} ${s.star}/10★ (eff ${effectiveLevel(s)}) · hp=${Math.round(sample.hp)} joy=${Math.round(sample.happiness)} actions=${sample.actions.join(",")}`);
}

// Did anything actually happen?
check(state.fame > 0, "fame grew above 0");
check(state.disciples.length >= 1, "at least one disciple survived");
check(state.disciples.some((d) => effectiveLevel(d.attributes.strength) > 1), "at least one disciple gained strength");

// Rank-up mechanic (deterministic): pump XP and confirm promotion + star reset + bounds.
const a = createAttr();
let promoted = false;
let ok = true;
for (let i = 0; i < 200000 && a.rank < 3; i++) {
  if (addXp(a, 40).rankedUp) promoted = true;
  if (a.star < 1 || a.star > 10) ok = false;
}
console.log(`\nRank-up probe: reached ${rankName(a.rank)} ${a.star}/10★ (eff ${effectiveLevel(a)})`);
check(promoted && a.rank >= 3, "addXp promotes ranks (reached rank 3)");
check(ok, "star stays within 1..10 across promotions");

console.log(failures === 0 ? "\n✓ ALL INVARIANTS PASSED" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
