// Minimal observable store. Holds the GameState (or null before a game starts).

import type { GameState } from "./gameState";

type Listener = (state: GameState | null) => void;

export class Store {
  private state: GameState | null;
  private listeners = new Set<Listener>();

  constructor(initial: GameState | null = null) {
    this.state = initial;
  }

  getState(): GameState | null {
    return this.state;
  }

  /** Throws if no game is active — use inside code that only runs while playing. */
  requireState(): GameState {
    if (!this.state) throw new Error("No active game state");
    return this.state;
  }

  setState(state: GameState | null): void {
    this.state = state;
    this.notify();
  }

  /** Mutate the active state in place, then notify subscribers. No-op if no game is active. */
  update(mutator: (state: GameState) => void): void {
    if (!this.state) return;
    mutator(this.state);
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}
