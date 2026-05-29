// Secrets runtime: a tiny "behavior" record that other systems poke (recordFailedTribulation,
// recordSurvivedAt1Hp, ...) plus checkSecrets() which walks every secret def and unlocks
// any whose condition is now true. Idempotent so safe to call after any event.

import type { GameState } from "../../state/gameState";
import { ALL_SECRET_IDS, SECRETS, type SecretId } from "../../data/secrets/secretDefs";
import { pushLog } from "../../state/log";

export interface BehaviorState {
  failedTribulations: number;
  /** Sticky — once a disciple survives at 1 HP in a run, this stays true. */
  survivedAt1Hp: boolean;
  /** Counts up daily; reset to 0 when any disciple is expelled or abandons. */
  daysSinceLastLoss: number;
}

export function createInitialBehavior(): BehaviorState {
  return { failedTribulations: 0, survivedAt1Hp: false, daysSinceLastLoss: 0 };
}

export function reconcileBehavior(b: Partial<BehaviorState> | undefined): BehaviorState {
  return {
    failedTribulations: Math.max(0, b?.failedTribulations ?? 0),
    survivedAt1Hp: Boolean(b?.survivedAt1Hp),
    daysSinceLastLoss: Math.max(0, b?.daysSinceLastLoss ?? 0),
  };
}

export function recordFailedTribulation(state: GameState): void {
  state.behavior.failedTribulations += 1;
}

export function recordSurvivedAt1Hp(state: GameState): void {
  state.behavior.survivedAt1Hp = true;
}

export function recordDiscipleLoss(state: GameState): void {
  state.behavior.daysSinceLastLoss = 0;
}

export function tickBehavior(state: GameState): void {
  state.behavior.daysSinceLastLoss += 1;
}

/** Walk every secret def; unlock + log any whose condition is now true. */
export function checkSecrets(state: GameState): void {
  const have = new Set(state.unlockedSecrets);
  for (const id of ALL_SECRET_IDS) {
    if (have.has(id)) continue;
    if (!SECRETS[id].isUnlocked(state)) continue;
    state.unlockedSecrets.push(id);
    have.add(id);
    pushLog(state, `Secret unlocked: ${SECRETS[id].label}.`, "good");
  }
}

export function isSecretUnlocked(state: GameState, id: SecretId): boolean {
  return state.unlockedSecrets.includes(id);
}
