// Wires interact.js drag onto the Sect-dashboard windows. interact is bound by SELECTOR
// (".window"), so it keeps working across the controller's full-DOM re-renders without
// re-initialising. On release, the window edge-snaps to its neighbors. interact itself is
// loaded lazily (dynamic import) so the headless tests never pull it in.

import {
  getWindowPos,
  setWindowPos,
  saveWindowLayout,
  type WindowId,
} from "./windowLayout";
import { computeSnap, type Rect } from "./snap";

let dragging = false;
let installed = false;

/** True while a window is mid-drag — the controller defers re-renders during this. */
export function isDraggingWindow(): boolean {
  return dragging;
}

/** Dragging is a desktop/pointer affordance; narrow or touch screens use the stacked fallback. */
export function windowsEnabled(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(min-width: 961px) and (pointer: fine)").matches;
}

function readPos(el: HTMLElement): { x: number; y: number } {
  return {
    x: parseFloat(el.dataset.x ?? "0") || 0,
    y: parseFloat(el.dataset.y ?? "0") || 0,
  };
}

function applyPos(el: HTMLElement, x: number, y: number): void {
  el.dataset.x = String(x);
  el.dataset.y = String(y);
  el.style.transform = `translate(${x}px, ${y}px)`;
}

/** Snap the just-dragged window's edges against its sibling windows. */
function snapAgainstSiblings(el: HTMLElement): { x: number; y: number } {
  const pos = readPos(el);
  const moving: Rect = { x: pos.x, y: pos.y, w: el.offsetWidth, h: el.offsetHeight };
  const targets: Rect[] = [];
  const canvas = el.parentElement;
  if (canvas) {
    for (const other of Array.from(canvas.querySelectorAll<HTMLElement>(".window"))) {
      if (other === el) continue;
      const oid = other.dataset.windowId as WindowId | undefined;
      if (!oid) continue;
      const p = getWindowPos(oid);
      targets.push({ x: p.x, y: p.y, w: other.offsetWidth, h: other.offsetHeight });
    }
  }
  return computeSnap(moving, targets);
}

/** Install drag handling once. `onCommit` runs after a drag ends so the app can re-render. */
export function installWindowDragging(onCommit: () => void): void {
  if (installed) return;
  installed = true;
  void import("interactjs").then(({ default: interact }) => {
    interact(".window").draggable({
      allowFrom: ".panel-title",
      listeners: {
        start() {
          dragging = true;
        },
        move(event) {
          const el = event.target as HTMLElement;
          const pos = readPos(el);
          applyPos(el, pos.x + event.dx, pos.y + event.dy);
        },
        end(event) {
          const el = event.target as HTMLElement;
          dragging = false;
          const id = el.dataset.windowId as WindowId | undefined;
          if (id) {
            const snapped = snapAgainstSiblings(el);
            applyPos(el, snapped.x, snapped.y);
            setWindowPos(id, snapped);
            saveWindowLayout();
          }
          onCommit();
        },
      },
    });
  });
}
