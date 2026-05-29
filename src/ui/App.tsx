// Root component: sect-selection when there's no game, otherwise the tabbed game shell.

import { lazy, Suspense, useEffect } from "react";
import type { GameState } from "../state/gameState";
import { useGameState, useEngine } from "./engineContext";
import { useView, useViewDispatch } from "./viewContext";
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
import { isTabVisible } from "./progression/visibility";
import { CurrentObjective } from "./progression/CurrentObjective";
import { PersonalEventModal } from "./events/PersonalEventModal";
import { ChainEventModal } from "./events/ChainEventModal";

// Tab bodies are code-split: the dashboard chunk (React Grid Layout + Motion) loads only
// once a game is in play, keeping the sect-selection screen + initial load lean.
const SectDashboard = lazy(() =>
  import("./tabs/SectDashboard").then((m) => ({ default: m.SectDashboard })),
);
const DisciplesView = lazy(() =>
  import("./tabs/DisciplesView").then((m) => ({ default: m.DisciplesView })),
);
const CraftView = lazy(() => import("./tabs/CraftView").then((m) => ({ default: m.CraftView })));
const StoryView = lazy(() => import("./tabs/StoryView").then((m) => ({ default: m.StoryView })));

function Game({ state }: { state: GameState }): JSX.Element {
  const view = useView();
  const dispatch = useViewDispatch();

  // If the player is sitting on a tab that's no longer unlocked (e.g. a save import that
  // resets progression, or a feature flag flip), fall them back to the Sect dashboard
  // rather than rendering an empty tab body.
  useEffect(() => {
    if (!isTabVisible(state, view.tab)) {
      dispatch({ type: "setTab", tab: "sect" });
    }
  }, [state, view.tab, dispatch]);

  let body: JSX.Element;
  if (view.tab === "disciples") {
    body = (
      <div className="view-disciples">
        <DisciplesView state={state} />
      </div>
    );
  } else if (view.tab === "craft") {
    body = <CraftView state={state} />;
  } else if (view.tab === "story") {
    body = <StoryView state={state} />;
  } else {
    body = <SectDashboard state={state} />;
  }

  return (
    <>
      <Topbar state={state} />
      <CurrentObjective state={state} />
      <Suspense fallback={<div className="muted loading">Loading…</div>}>{body}</Suspense>
      <footer className="footer">
        <Achievements />
        <Stats />
        <SaveLoad />
        <Settings />
      </footer>
      <PersonalEventModal state={state} />
      <ChainEventModal state={state} />
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
