import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useSpring } from 'framer-motion';
import type { CameraFrame, Point, Size } from '../lib/keywordMapLayout';

export const ZOOM_MIN = 0.85;
export const ZOOM_MAX = 1.8;
const CAMERA_SPRING = { stiffness: 210, damping: 32, mass: 0.9 };
const DRAG_THRESHOLD = 6;
const SWIPE_MIN = 50;

interface CameraOptions {
  viewport: Size;
  /** Automatic framing of the current scene; user zoom/pan sit on top of it. */
  frame: CameraFrame;
  reduceMotion: boolean;
  /** User zoom/pan reset whenever this changes (the camera follows the new centre). */
  resetKey: string;
  /** Horizontal swipe on an unzoomed map (mobile): 1 = swiped left, -1 = right. */
  onSwipe?: (dir: 1 | -1) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Camera for the keyword map: automatic framing, optional zoom (0.85–1.8×) and
 * drag-to-pan once zoomed. Writes the transform straight to the scene group
 * through motion values, so springs never re-render React.
 */
export function useMapCamera(svgRef: RefObject<SVGSVGElement>, sceneRef: RefObject<SVGGElement>, opts: CameraOptions) {
  const { viewport, frame, reduceMotion, resetKey, onSwipe } = opts;
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });

  const target = useCallback(
    (z: number, pan: Point) => {
      const s = frame.scale * z;
      return { s, x: viewport.width / 2 + pan.x - s * frame.focus.x, y: viewport.height / 2 + pan.y - s * frame.focus.y };
    },
    [frame, viewport],
  );

  const tx = useSpring(0, CAMERA_SPRING);
  const ty = useSpring(0, CAMERA_SPRING);
  const ts = useSpring(1, CAMERA_SPRING);

  const apply = useCallback(
    (immediate = false) => {
      const t = target(zoomRef.current, panRef.current);
      if (immediate || reduceMotion) {
        tx.jump(t.x);
        ty.jump(t.y);
        ts.jump(t.s);
      } else {
        tx.set(t.x);
        ty.set(t.y);
        ts.set(t.s);
      }
    },
    [target, reduceMotion, tx, ty, ts],
  );

  // Before first paint: jump to the framed position and start mirroring springs to the DOM.
  useLayoutEffect(() => {
    const write = () =>
      sceneRef.current?.setAttribute('transform', `translate(${tx.get()} ${ty.get()}) scale(${ts.get()})`);
    apply(true);
    write();
    const subs = [tx.on('change', write), ty.on('change', write), ts.on('change', write)];
    return () => subs.forEach(unsub => unsub());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => apply(), [apply]);

  const setZoom = useCallback((z: number) => {
    zoomRef.current = z;
    setZoomState(z);
  }, []);

  const clampPan = (p: Point, z: number): Point => {
    if (z <= 1) return { x: 0, y: 0 };
    const lx = (viewport.width * (z - 1)) / 2 + 40;
    const ly = (viewport.height * (z - 1)) / 2 + 40;
    return { x: clamp(p.x, -lx, lx), y: clamp(p.y, -ly, ly) };
  };

  const reset = useCallback(() => {
    setZoom(1);
    panRef.current = { x: 0, y: 0 };
    apply();
  }, [apply, setZoom]);

  useEffect(() => {
    if (zoomRef.current !== 1 || panRef.current.x !== 0 || panRef.current.y !== 0) reset();
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Zoom keeping the point `at` (scene-viewport coordinates) fixed on screen. */
  const zoomAt = (factor: number, at: Point = { x: viewport.width / 2, y: viewport.height / 2 }) => {
    const z = zoomRef.current;
    const z2 = clamp(z * factor, ZOOM_MIN, ZOOM_MAX);
    if (z2 === z) return;
    const t = target(z, panRef.current);
    const world = { x: (at.x - t.x) / t.s, y: (at.y - t.y) / t.s };
    const s2 = frame.scale * z2;
    const pan = {
      x: at.x - s2 * world.x - viewport.width / 2 + s2 * frame.focus.x,
      y: at.y - s2 * world.y - viewport.height / 2 + s2 * frame.focus.y,
    };
    panRef.current = clampPan(pan, z2);
    setZoom(z2);
    apply();
  };

  const toViewport = (clientX: number, clientY: number): Point => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return { x: 0, y: 0 };
    return { x: ((clientX - r.left) * viewport.width) / r.width, y: ((clientY - r.top) * viewport.height) / r.height };
  };

  // Ctrl/⌘ + wheel (and trackpad pinch, which reports ctrlKey) zooms; plain wheel keeps scrolling the page.
  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const at = { x: ((e.clientX - r.left) * viewport.width) / r.width, y: ((e.clientY - r.top) * viewport.height) / r.height };
      zoomAtRef.current(Math.exp(-e.deltaY * 0.01), at);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef, viewport]);

  // ── pointer: drag-to-pan when zoomed, swipe when not ──────────────
  const gesture = useRef<{ id: number; start: Point; pan: Point; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    gesture.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, pan: { ...panRef.current }, dragging: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    // Released outside the map before capture: the gesture is over, not a hover-drag.
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      gesture.current = null;
      return;
    }
    const a = toViewport(g.start.x, g.start.y);
    const b = toViewport(e.clientX, e.clientY);
    const d = { x: b.x - a.x, y: b.y - a.y };
    if (!g.dragging && Math.hypot(d.x, d.y) > DRAG_THRESHOLD) {
      g.dragging = true;
      // Capture only now, so plain clicks still reach nodes. Can throw if the pointer already ended.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* keep tracking without capture */
      }
    }
    if (g.dragging && zoomRef.current > 1) {
      panRef.current = clampPan({ x: g.pan.x + d.x, y: g.pan.y + d.y }, zoomRef.current);
      apply(true);
    }
  };

  const endGesture = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.dragging) return;
    // Swallow the click that ends this drag; clear afterwards in case none follows.
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    const dx = e.clientX - g.start.x;
    const dy = e.clientY - g.start.y;
    if (onSwipe && zoomRef.current <= 1 && Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.stopPropagation();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.kmap-node')) return;
    reset();
  };

  return {
    zoom,
    zoomBy: (factor: number) => zoomAt(factor),
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: (e: React.PointerEvent<SVGSVGElement>) => {
        gesture.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      },
      onClickCapture,
      onDoubleClick,
    },
  };
}
