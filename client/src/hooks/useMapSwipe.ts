import { useRef } from 'react';
import type { Point } from '../lib/keywordMapLayout';

const DRAG_THRESHOLD = 6;
const SWIPE_MIN = 50;

/**
 * Pointer gestures for the keyword map: a horizontal swipe calls `onSwipe`
 * (mobile: 1 = swiped left, -1 = right), and the click that ends any drag is
 * swallowed so it doesn't explore the node under the finger.
 */
export function useMapSwipe(onSwipe?: (dir: 1 | -1) => void) {
  const gesture = useRef<{ id: number; start: Point; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    gesture.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, dragging: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    // Released outside the map before capture: the gesture is over, not a hover-drag.
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      gesture.current = null;
      return;
    }
    if (!g.dragging && Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y) > DRAG_THRESHOLD) {
      g.dragging = true;
      // Capture only now, so plain clicks still reach nodes. Can throw if the pointer already ended.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* keep tracking without capture */
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.dragging) return;
    // Swallow the click that ends this drag; clear afterwards in case none follows.
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    const dx = e.clientX - g.start.x;
    const dy = e.clientY - g.start.y;
    if (onSwipe && Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  };

  const onPointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.stopPropagation();
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture };
}
