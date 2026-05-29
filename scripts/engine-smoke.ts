// Headless engine test: the GameEngine drives state + actions without any DOM.

const g = globalThis as unknown as Record<string, unknown>;
g.requestAnimationFrame = () => 0;
g.cancelAnimationFrame = () => {};
const ls = new Map<string, string>();
g.localStorage = {
  getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null),
  setItem: (k: string, v: string) => void ls.set(k, String(v)),
  removeItem: (k: string) => void ls.delete(k),
};

const { GameEngine } = await import("../src/core/engine");

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}

const engine = new GameEngine();
check(engine.getState() === null, "no game state before newGame");

engine.newGame("sword");
const s0 = engine.getState();
check(s0 !== null, "newGame creates state");
check((s0?.disciples.length ?? 0) >= 1, "starting disciples present");

const v0 = engine.getVersion();
engine.manualCollect("stone");
check(engine.getVersion() > v0, "store version bumps on an action (drives React re-render)");

engine.setSpeed(4);
check(engine.getState()!.settings.speed === 4 && !engine.getState()!.settings.paused, "setSpeed applies and unpauses");

engine.togglePause();
check(engine.getState()!.settings.paused === true, "togglePause pauses");

engine.setAllActions("train");
check(
  engine.getState()!.disciples.every((d) => d.actions.every((a) => a === "train")),
  "setAllActions sets every slot for everyone",
);

const firstId = engine.getState()!.disciples[0].id;
engine.setActionsForDisciples([firstId], 0, "idle");
const first = engine.getState()!.disciples.find((d) => d.id === firstId)!;
check(first.actions[0] === "idle" && first.actions[1] === "train", "setActionsForDisciples targets one slot of selected disciples");

// Merchant pavilion + auto-sell config.
check(engine.getState()!.buildings.merchant.level === 0, "merchant starts unbuilt");
const st = engine.getState()!;
st.resources.wood = 300;
st.resources.stone = 300;
engine.upgradePavilion("merchant");
check(engine.getState()!.buildings.merchant.level === 1, "merchant pavilion can be built");
engine.setAutoSell("wood", 40);
check(engine.getState()!.autoSell.wood === 40, "setAutoSell stores the percentage");
engine.setAutoSell("wood", 999);
check(engine.getState()!.autoSell.wood === 100, "setAutoSell clamps to 0–100");

// Export/import round-trip: a base64 code restores the game and rejects garbage.
const code = engine.exportSave();
check(typeof code === "string" && code!.length > 0, "exportSave returns a base64 code");
engine.newGame("bow"); // replace the current game to prove import overwrites it
check(engine.getState()!.sect.type === "bow", "newGame switched sect before import");
check(engine.importSave(code!), "importSave accepts a valid code");
check(engine.getState()!.sect.type === "sword", "importSave restored the original game");
check(engine.importSave("not valid base64 !!") === false, "importSave rejects an invalid code");

// --- Hostile-save scenarios (S1 / OWASP hardening). The schema validator should reject all
//     of these BEFORE migrate() or any state replacement runs. importSave returns false and
//     the existing game stays untouched. ---
const beforeBaseline = engine.getState();
const baselineSect = beforeBaseline!.sect.type;

function toBase64(s: string): string {
  return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
}

// 1) Outright garbage payload.
check(engine.importSave(toBase64("not json at all")) === false, "importSave rejects non-JSON payload");

// 2) Valid JSON but the wrong top-level shape (an array, not an object).
check(engine.importSave(toBase64(JSON.stringify([1, 2, 3]))) === false, "importSave rejects array payload");

// 3) Required field is the wrong type.
check(
  engine.importSave(toBase64(JSON.stringify({ version: "seventeen" }))) === false,
  "importSave rejects non-number version",
);

// 4) Numbers wildly outside our caps.
const huge = engine.exportSave()!;
const realJson = JSON.parse(
  decodeURIComponent(
    Array.prototype.map
      .call(atob(huge), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  ),
) as Record<string, unknown>;
(realJson as { resources: Record<string, number> }).resources.gold = 1e15; // > maxResource
check(
  engine.importSave(toBase64(JSON.stringify(realJson))) === false,
  "importSave rejects resource value above the cap",
);

// 5) Disciple roster bloated past the cap.
const bloated = JSON.parse(
  decodeURIComponent(
    Array.prototype.map
      .call(atob(engine.exportSave()!), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  ),
) as { disciples: unknown[] };
const seed = bloated.disciples[0];
bloated.disciples = Array.from({ length: 1000 }, () => seed);
check(
  engine.importSave(toBase64(JSON.stringify(bloated))) === false,
  "importSave rejects roster larger than maxDisciples",
);

// 6) After all those rejections the current game must be unchanged.
check(engine.getState()!.sect.type === baselineSect, "state is preserved after rejected imports");

// --- Progressive disclosure (item 1). A fresh game seeds only the Disciples tab; building
//     the Merchant Pavilion mid-play unfolds the Market panel without waiting for a tick. ---
engine.newGame("sword");
const fresh = engine.getState()!;
check(fresh.unlocked.includes("tab.disciples"), "fresh game unlocks Disciples tab (starter disciples)");
check(!fresh.unlocked.includes("panel.market"), "fresh game keeps Market panel hidden");
check(!fresh.unlocked.includes("tab.craft"), "fresh game keeps Craft tab hidden");

fresh.resources.wood = 300;
fresh.resources.stone = 300;
engine.upgradePavilion("merchant");
check(
  engine.getState()!.unlocked.includes("panel.market"),
  "upgradePavilion(merchant) unfolds the Market panel immediately",
);

fresh.resources.wood = 400;
fresh.resources.stone = 400;
fresh.resources.gold = 200;
engine.upgradePavilion("forge");
const afterForge = engine.getState()!;
check(afterForge.unlocked.includes("tab.craft"), "upgradePavilion(forge) unfolds the Craft tab");
check(afterForge.unlocked.includes("craft.forge"), "upgradePavilion(forge) unfolds the Forge craft panel");

// --- B1 WorldClocks: fresh game seeds both clocks; the Bandit Threat fires after ~45 days. ---
engine.newGame("sword");
const w0 = engine.getState()!;
check(w0.worldClocks.length === 2, "fresh game seeds 2 world clocks");
check(w0.worldClocks.every((c) => c.progress === 0 && c.cycles === 0), "world clocks start at 0");

// Stock a resource so the bandit raid has something to steal, then run 50 days. The
// bandit_threat clock (threshold 45) should fire exactly once and the wood stockpile drop.
w0.resources.wood = 500;
const woodBefore = w0.resources.wood;
const { advanceDay: advanceDayDirect } = await import("../src/domain/simulation/advanceDay");
const { Rng: RngImpl } = await import("../src/core/rng/rng");
const rng = new RngImpl(w0.rngSeed);
for (let i = 0; i < 50; i++) advanceDayDirect(w0, rng);
const bandit = w0.worldClocks.find((c) => c.id === "bandit_threat")!;
check(bandit.cycles === 1, "bandit_threat fires once across 50 days");
check(bandit.progress < 45, "bandit_threat reset after firing");
check(w0.resources.wood < woodBefore, "bandit raid stole some stockpiled wood");

// World panel unlocks once totalDays passes 7 — engine's daily tick handles it.
check(
  engine.getState()!.unlocked.includes("panel.world"),
  "panel.world unlocks after the first week",
);

// --- B3 Personal events: queue/resolve round-trip ---
engine.newGame("sword");
const peState = engine.getState()!;
check(peState.pendingPersonalEvents.length === 0, "fresh game has no pending personal events");
// Manually queue an event for the first disciple, then resolve it.
const firstDiscipleId = peState.disciples[0].id;
peState.pendingPersonalEvents.push({
  eventId: "orphan_visitor",
  discipleId: firstDiscipleId,
  queuedOn: 0,
});
// Force the origin so the event "fits" (cosmetic — apply runs regardless of canFire).
peState.disciples[0].origin = "orphan";
const happinessBefore = peState.disciples[0].happiness;
engine.resolvePersonalEvent(firstDiscipleId, "welcome");
const peAfter = engine.getState()!;
check(peAfter.pendingPersonalEvents.length === 0, "resolvePersonalEvent pops the queue entry");
check(
  peAfter.disciples[0].happiness > happinessBefore,
  "orphan_visitor 'welcome' choice raises happiness",
);
// Unknown choice id is a no-op (still pops the entry).
peAfter.pendingPersonalEvents.push({
  eventId: "orphan_visitor",
  discipleId: firstDiscipleId,
  queuedOn: 0,
});
engine.resolvePersonalEvent(firstDiscipleId, "no_such_choice");
check(
  engine.getState()!.pendingPersonalEvents.length === 0,
  "resolvePersonalEvent with unknown choice still pops",
);

// --- B4 Missions: start, recall, advance-to-completion ---
engine.newGame("sword");
const mState = engine.getState()!;
check(mState.missionOffers.length === 3, "fresh game offers all 3 missions");
check(mState.activeMissions.length === 0, "fresh game has no active missions");
// Pick the first disciple and send them on the scout_road mission (1 disciple, 5 days).
const scoutId = mState.disciples[0].id;
const sent = engine.startMission("scout_road", [scoutId]);
check(sent === true, "startMission(scout_road) succeeds with 1 disciple");
check(engine.getState()!.activeMissions.length === 1, "active mission registered");
check(engine.getState()!.disciples[0].status === "on_mission", "assigned disciple is on_mission");
check(
  !engine.getState()!.missionOffers.includes("scout_road"),
  "started mission removed from offer board",
);
// Recall — disciple comes back to active, mission goes back on the board.
engine.recallMission("scout_road");
const recalled = engine.getState()!;
check(recalled.activeMissions.length === 0, "recallMission empties active list");
check(recalled.disciples[0].status === "active", "recalled disciple returns to active status");
check(recalled.missionOffers.includes("scout_road"), "recalled mission goes back on offer board");

// Run a full mission to completion: send + advance 6 days + verify resolve fired.
engine.startMission("scout_road", [scoutId]);
const beforeGold = engine.getState()!.resources.gold;
for (let i = 0; i < 6; i++) advanceDayDirect(engine.getState()!, rng);
const done = engine.getState()!;
check(done.activeMissions.length === 0, "mission resolves after duration elapses");
check(done.disciples[0].status !== "on_mission", "disciple flipped back from on_mission");
check(done.resources.gold > beforeGold, "scout_road delivered some gold reward");

// --- B5 Event chains: spawn -> resolve choices -> mark completed ---
engine.newGame("sword");
const cState = engine.getState()!;
check(cState.activeEventChains.length === 0, "fresh game has no active chains");
check(cState.completedEventChains.length === 0, "fresh game has no completed chains");
// Manually push the sealed_cave chain to test the resolver — daily roll is RNG-dependent.
cState.activeEventChains.push({ chainId: "sealed_cave", stageId: "discover", startedOn: 0 });
// Choose "leave_alone" which ends the chain with -4 fame.
cState.fame = 20;
engine.resolveChainChoice("sealed_cave", "leave_alone");
const c1 = engine.getState()!;
check(c1.activeEventChains.length === 0, "ending choice removes chain from active");
check(c1.completedEventChains.includes("sealed_cave"), "ending choice marks chain completed");
check(c1.fame === 16, "leave_alone choice applied its -4 fame effect");
// Branching choice: push again, pick a transition (break_seal -> inside), verify chain stays active.
c1.activeEventChains.push({ chainId: "sealed_cave", stageId: "discover", startedOn: 0 });
c1.completedEventChains = c1.completedEventChains.filter((id) => id !== "sealed_cave");
engine.resolveChainChoice("sealed_cave", "break_seal");
const c2 = engine.getState()!;
check(c2.activeEventChains.length === 1, "transition choice keeps chain active");
check(c2.activeEventChains[0].stageId === "inside", "transition moves to the named next stage");

// --- C1 Doctrines: pick, persist, observe effect on sell price ---
engine.newGame("sword");
const dState = engine.getState()!;
check(dState.doctrine === null, "fresh game has no doctrine");
dState.sect.level = 2; // satisfy canPickDoctrine
dState.resources.wood = 500;
dState.resources.gold = 0;
// Sell BEFORE doctrine for baseline.
engine.sell("wood", 50);
const goldNoDoctrine = engine.getState()!.resources.gold;
engine.getState()!.resources.wood = 500;
engine.getState()!.resources.gold = 0;
// Pick mercantile (+35% sell prices).
const picked = engine.pickDoctrine("mercantile");
check(picked === true, "pickDoctrine succeeds on a fresh sect at level 2");
check(engine.getState()!.doctrine === "mercantile", "doctrine persisted to state");
// Picking again should be a no-op.
check(engine.pickDoctrine("harmony") === false, "pickDoctrine rejects when one is already set");
check(engine.getState()!.doctrine === "mercantile", "second pick attempt leaves the original");
// Sell again and confirm price is higher.
engine.sell("wood", 50);
const goldWithDoctrine = engine.getState()!.resources.gold;
check(
  goldWithDoctrine > goldNoDoctrine,
  "mercantile doctrine raises market sell price (1.35× wood gold)",
);

console.log(failures === 0 ? "\n✓ ENGINE OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
