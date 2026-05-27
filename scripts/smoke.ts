// Headless smoke test: run a year of simulation and assert invariants.
// Bundled with esbuild and run under Node (no DOM needed — domain logic is DOM-free).

import { Rng } from "../src/core/rng/rng";
import { createNewGame } from "../src/state/gameState";
import { advanceDay } from "../src/domain/simulation/advanceDay";
import { warehouseCap } from "../src/domain/resources/resources";
import { disciplesCapacity } from "../src/domain/buildings/buildings";
import { upgradePavilion } from "../src/domain/buildings/buildings";
import { acceptApplicant } from "../src/domain/disciples/recruitment";
import { STORABLE_RESOURCES } from "../src/domain/resources/resourceTypes";
import { effectiveLevel, createAttr, addXp } from "../src/domain/disciples/attributes";
import { rankName } from "../src/data/progression";
import { MAX_APPLICANTS } from "../src/data/balance";
import { progressNarrative } from "../src/domain/simulation/storyEvents";
import { validateInvestigation } from "../src/domain/investigations/validator";
import { canAcceptQuest } from "../src/domain/quests/quest";
import { sanitizeLayout, defaultLayout, PANEL_IDS } from "../src/ui/windows/gridLayout";

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

  // Auto-accept applicants while there's room (recruitment is now an Accept/Deny queue).
  while (state.applicants.length > 0 && state.disciples.length < disciplesCapacity(state)) {
    acceptApplicant(state, state.applicants[0].id);
  }

  // Invariants every day:
  check(state.applicants.length <= MAX_APPLICANTS, `applicants within cap on day ${i}`);
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

// Narrative pipeline probe (deterministic — drive content unlocks by sect level + flags).
const nrng = new Rng(42);
const ng = createNewGame("sword", nrng);
ng.sect.level = 2; // unlock the sect-level-gated clue + NPC encounter

progressNarrative(ng); // detects events for level 2, then applies them
check(ng.narrative.discoveredClues.includes("expulsion_letter"), "clue discovered at sect level 2");
check(
  ng.narrative.pendingEncounters.some((p) => p.npcId === "mestre_chen"),
  "NPC encounter queued in the inbox",
);
check(ng.narrative.flags.met_chen === true, "encounter once-flag set on apply");

progressNarrative(ng); // met_chen now true -> second clue becomes discoverable
check(ng.narrative.discoveredClues.includes("witness_account"), "flag-gated clue unlocks next tick");

check(canAcceptQuest("first_disciples", ng), "first_disciples quest available from start");
check(canAcceptQuest("seek_chen", ng), "seek_chen quest available at sect level 2");

const allClues = ["expulsion_letter", "witness_account"];
check(
  validateInvestigation("was_i_guilty", "unknown_rival", [], ng).outcome === "failure",
  "investigation fails with missing clues",
);
check(
  validateInvestigation("was_i_guilty", "mestre_chen", allClues, ng).outcome === "partial",
  "investigation is partial with the wrong suspect",
);
check(
  validateInvestigation("was_i_guilty", "unknown_rival", allClues, ng).outcome === "success",
  "investigation succeeds with all clues + correct suspect",
);
console.log(`\nNarrative probe: clues=${ng.narrative.discoveredClues.join(",")} pending=${ng.narrative.pendingEncounters.length}`);

// Grid-layout sanitisation (pure): a saved layout missing a panel + carrying a stale id is
// repaired to exactly the five known panels (missing ones fall back to defaults).
const partial = [
  { i: "overview", x: 5, y: 2, w: 4, h: 6 },
  { i: "ghost", x: 0, y: 0, w: 4, h: 4 }, // unknown -> dropped
];
const fixed = sanitizeLayout(partial);
check(fixed.length === PANEL_IDS.length, "sanitizeLayout yields exactly the known panels");
check(fixed.every((it) => PANEL_IDS.includes(it.i as (typeof PANEL_IDS)[number])), "no unknown panels survive");
const ov = fixed.find((it) => it.i === "overview");
check(ov?.x === 5 && ov?.y === 2, "a saved panel keeps its persisted position");
const log = fixed.find((it) => it.i === "log");
const defLog = defaultLayout().find((it) => it.i === "log");
check(log?.x === defLog?.x && log?.y === defLog?.y, "a missing panel falls back to its default slot");

// Gold upkeep consequence: broke + high upkeep -> arrears, morale hit, and structural decay.
const grng = new Rng(7);
const gg = createNewGame("sword", grng);
gg.resources.gold = 0;
gg.sect.level = 3; // wages = 15 gold/month, far above the +1 passive trickle
for (let i = 0; i < 30; i++) advanceDay(gg, grng); // cross one month boundary
check(gg.goldArrears >= 1, "unpaid gold upkeep accrues arrears");
check(gg.log.some((e) => /wages/i.test(e.text)), "a wages-unpaid event is logged");
for (let i = 0; i < 150; i++) advanceDay(gg, grng); // let the debt drag on past the grace period
check(gg.sect.level < 3, "persistent unpaid wages decay a structure");

// Merchant auto-sell: a full store is partially sold for gold once the pavilion is built.
const arng = new Rng(11);
const ag = createNewGame("sword", arng);
ag.buildings.merchant.level = 1;
ag.autoSell.wood = 50;
const woodCap = warehouseCap(ag.buildings.warehouse.level);
ag.resources.wood = woodCap;
const goldBefore = ag.resources.gold;
advanceDay(ag, arng);
check(ag.resources.wood < woodCap, "auto-sell offloads a full store");
check(ag.resources.gold > goldBefore, "auto-sell converts surplus into gold");

console.log(failures === 0 ? "\n✓ ALL INVARIANTS PASSED" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
