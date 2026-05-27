// Pure edge-magnetic snapping. Given a moving window's rect and the other windows' rects,
// nudge the moving window so a near-aligned edge clicks into place. DOM-free so it can be
// unit-tested under Node.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SNAP_THRESHOLD = 10; // px

/**
 * Snap x and y independently to the nearest aligning edge within `threshold`.
 * Considers, against every target: left/right edge alignment and abutting (placing the
 * moving window flush beside a neighbor), plus the canvas top/left edges. Never returns
 * negative coordinates.
 */
export function computeSnap(
  moving: Rect,
  targets: Rect[],
  threshold = SNAP_THRESHOLD,
): { x: number; y: number } {
  let bestX = moving.x;
  let bestY = moving.y;
  let dxBest = threshold + 1;
  let dyBest = threshold + 1;

  const movLeft = moving.x;
  const movRight = moving.x + moving.w;
  const movTop = moving.y;
  const movBottom = moving.y + moving.h;

  const tryX = (candidateLeft: number): void => {
    const d = Math.abs(candidateLeft - moving.x);
    if (d < dxBest) {
      dxBest = d;
      bestX = candidateLeft;
    }
  };
  const tryY = (candidateTop: number): void => {
    const d = Math.abs(candidateTop - moving.y);
    if (d < dyBest) {
      dyBest = d;
      bestY = candidateTop;
    }
  };

  for (const t of targets) {
    const tLeft = t.x;
    const tRight = t.x + t.w;
    const tTop = t.y;
    const tBottom = t.y + t.h;

    // Vertical edges -> snap moving.x
    if (Math.abs(movLeft - tLeft) <= threshold) tryX(tLeft); // left-align
    if (Math.abs(movLeft - tRight) <= threshold) tryX(tRight); // abut to the right of target
    if (Math.abs(movRight - tRight) <= threshold) tryX(tRight - moving.w); // right-align
    if (Math.abs(movRight - tLeft) <= threshold) tryX(tLeft - moving.w); // abut to the left of target

    // Horizontal edges -> snap moving.y
    if (Math.abs(movTop - tTop) <= threshold) tryY(tTop); // top-align
    if (Math.abs(movTop - tBottom) <= threshold) tryY(tBottom); // sit just below target
    if (Math.abs(movBottom - tBottom) <= threshold) tryY(tBottom - moving.h); // bottom-align
    if (Math.abs(movBottom - tTop) <= threshold) tryY(tTop - moving.h); // sit just above target
  }

  // Snap to the canvas origin edges.
  if (Math.abs(moving.x) <= threshold) tryX(0);
  if (Math.abs(moving.y) <= threshold) tryY(0);

  return { x: Math.max(0, bestX), y: Math.max(0, bestY) };
}
