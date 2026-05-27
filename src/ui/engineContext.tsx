// React access to the game engine: the engine is provided once and exposed as reactive
// state (useGameState) plus the action surface (useActions).

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { GameEngine, GameActions } from "../core/engine";
import type { GameState } from "../state/gameState";

const EngineContext = createContext<GameEngine | null>(null);

export function EngineProvider({
  engine,
  children,
}: {
  engine: GameEngine;
  children: ReactNode;
}): JSX.Element {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}

export function useEngine(): GameEngine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error("useEngine must be used within an EngineProvider");
  return engine;
}

/** Reactive game state — re-renders the component whenever the store changes. */
export function useGameState(): GameState | null {
  const engine = useEngine();
  // The store mutates state in place, so we subscribe to its version counter and read the
  // (current) state object directly afterward.
  useSyncExternalStore(engine.subscribe, engine.getVersion, engine.getVersion);
  return engine.getState();
}

/** The engine doubles as the action surface for components. */
export function useActions(): GameActions {
  return useEngine();
}
