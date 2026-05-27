// Root component: sect-selection when there's no game, otherwise the tabbed game shell.

import { lazy, Suspense } from "react";
import type { GameState } from "../state/gameState";
import { useGameState, useActions } from "./engineContext";
import { useView } from "./viewContext";
import { NewGameScreen } from "./NewGameScreen";
import { Topbar } from "./Topbar";
import { UpdateBanner } from "./UpdateBanner";
import { SaveLoad } from "./SaveLoad";
import { Toasts } from "./Toasts";

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
        <SaveLoad />
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
  return (
    <>
      {state ? <Game state={state} /> : <NewGameScreen />}
      <Toasts />
      <UpdateBanner />
    </>
  );
}
