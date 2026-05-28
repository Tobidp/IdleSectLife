// Root component: sect-selection when there's no game, otherwise the tabbed game shell.

import { lazy, Suspense, useEffect } from "react";
import type { GameState } from "../state/gameState";
import { useGameState, useActions, useEngine } from "./engineContext";
import { useView } from "./viewContext";
import { usePrefs } from "./prefsContext";
import { NewGameScreen } from "./NewGameScreen";
import { Topbar } from "./Topbar";
import { UpdateBanner } from "./UpdateBanner";
import { SaveLoad } from "./SaveLoad";
import { Toasts } from "./Toasts";
import { WelcomeBack } from "./WelcomeBack";
import { Achievements } from "./Achievements";
import { Stats } from "./Stats";
import { Settings } from "./Settings";
import { Alchemy } from "./Alchemy";
import { Forge } from "./Forge";

// Tab bodies are code-split: the dashboard chunk (React Grid Layout + Motion) loads only
// once a game is in play, keeping the sect-selection screen + initial load lean.
const SectDashboard = lazy(() =>
  import("./tabs/SectDashboard").then((m) => ({ default: m.SectDashboard })),
);
const DisciplesView = lazy(() =>
  import("./tabs/DisciplesView").then((m) => ({ default: m.DisciplesView })),
);
const StoryView = lazy(() => import("./tabs/StoryView").then((m) => ({ default: m.StoryView })));

function Game({ state }: { state: GameState }): JSX.Element {
  const view = useView();
  const actions = useActions();

  let body: JSX.Element;
  if (view.tab === "disciples") {
    body = (
      <div className="view-disciples">
        <DisciplesView state={state} />
      </div>
    );
  } else if (view.tab === "story") {
    body = <StoryView state={state} />;
  } else {
    body = <SectDashboard state={state} />;
  }

  return (
    <>
      <Topbar state={state} />
      <Suspense fallback={<div className="muted loading">Loading…</div>}>{body}</Suspense>
      <footer className="footer">
        <Achievements />
        <Alchemy />
        <Forge />
        <Stats />
        <SaveLoad />
        <Settings />
        <button
          className="reset-btn"
          title="Delete this save and choose a new sect"
          onClick={() => actions.hardReset()}
        >
          Abandon &amp; Start Over
        </button>
      </footer>
    </>
  );
}

export function App(): JSX.Element {
  const state = useGameState();
  const engine = useEngine();
  const prefs = usePrefs();
  // Sync the player's chosen tab-hidden behavior into the engine so the visibilitychange
  // listener uses the latest preference without re-creating the engine.
  useEffect(() => {
    engine.setHiddenBehavior(prefs.hiddenBehavior);
  }, [engine, prefs.hiddenBehavior]);

  return (
    <>
      {state ? <Game state={state} /> : <NewGameScreen />}
      <Toasts />
      <WelcomeBack />
      <UpdateBanner />
    </>
  );
}
