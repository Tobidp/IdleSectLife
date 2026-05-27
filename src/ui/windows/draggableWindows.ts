// Wires interact.js drag onto the Sect-dashboard windows. interact is bound by SELECTOR
// (".window"), so it keeps working across the controller's full-DOM re-renders without
// re-initialising. While dragging, the window follows the pointer (a transform offset from
// its flow slot); on release it drops into the NEAREST column at the vertical position where
// it was let go, then the columns relayout via native CSS flow (consistent gaps, no overlap).
// interact is loaded lazily so the headless tests never pull it in.

import {
  getLayout,
  setLayout,
  saveWindowLayout,
  computeReorder,
  type WindowId,
} from "./windowLayout";

let dragging = false;
let installed = false;

/** True while a window is mid-drag — the controller defers re-renders during this. */
export function isDraggingWindow(): boolean {
  return dragging;
}

/** Dragging is a desktop/pointer affordance; narrow or touch screens use the stacked fallback. */
export function windowsEnabled(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  // Three fluid columns need a roomy viewport; below this, fall back to the stacked layout.
  return window.matchMedia("(min-width: 980px) and (pointer: fine)").matches;
}

function centerOf(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Work out which column/slot the dropped window landed in, then commit the reorder. */
function dropIntoSlot(el: HTMLElement): void {
  const id = el.dataset.windowId as WindowId | undefined;
  const canvas = el.closest(".window-canvas");
  if (!id || !canvas) return;

  const moving = centerOf(el.getBoundingClientRect());
  const columns = Array.from(canvas.querySelectorAll<HTMLElement>(".window-col"));

  // Nearest column by horizontal center.
  let targetCol = 0;
  let bestDx = Infinity;
  columns.forEach((colEl, ci) => {
    const dx = Math.abs(centerOf(colEl.getBoundingClientRect()).x - moving.x);
    if (dx < bestDx) {
      bestDx = dx;
      targetCol = ci;
    }
  });

  // Insertion index: how many windows in the target column sit above the drop point.
  const others = Array.from(columns[targetCol].querySelectorAll<HTMLElement>(".window")).filter(
    (w) => w !== el,
  );
  let insertIndex = 0;
  for (const w of others) {
    if (moving.y > centerOf(w.getBoundingClientRect()).y) insertIndex++;
  }

  setLayout(computeReorder(getLayout(), id, targetCol, insertIndex));
  saveWindowLayout();
}

/** Install drag handling once. `onCommit` runs after a drag ends so the app can re-render. */
export function installWindowDragging(onCommit: () => void): void {
  if (installed) return;
  installed = true;
  void import("interactjs").then(({ default: interact }) => {
    interact(".window").draggable({
      allowFrom: ".panel-title",
      listeners: {
        start(event) {
          dragging = true;
          const el = event.target as HTMLElement;
          el.classList.add("is-dragging");
          el.dataset.x = "0";
          el.dataset.y = "0";
        },
        move(event) {
          const el = event.target as HTMLElement;
          const x = (parseFloat(el.dataset.x ?? "0") || 0) + event.dx;
          const y = (parseFloat(el.dataset.y ?? "0") || 0) + event.dy;
          el.dataset.x = String(x);
          el.dataset.y = String(y);
          el.style.transform = `translate(${x}px, ${y}px)`;
        },
        end(event) {
          const el = event.target as HTMLElement;
          dragging = false;
          dropIntoSlot(el);
          // Clear the drag offset; the re-render places the window in its new flow slot.
          el.style.transform = "";
          el.classList.remove("is-dragging");
          onCommit();
        },
      },
    });
  });
}
