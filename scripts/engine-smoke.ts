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

console.log(failures === 0 ? "\n✓ ENGINE OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
