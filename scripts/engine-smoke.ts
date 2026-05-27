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

console.log(failures === 0 ? "\n✓ ENGINE OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
