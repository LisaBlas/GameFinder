import { useEffect, useState, type RefObject } from 'react';

const IDLE_MS = 45_000;

/**
 * Whether decorative map animation (breathing glow, energy) should pause:
 * tab hidden, map scrolled offscreen, or no pointer/keyboard activity for a
 * while. Applied as a data attribute so CSS can pause animations without
 * React re-rendering anything per frame.
 */
export function useAmbientPause(ref: RefObject<HTMLElement>): boolean {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [offscreen, setOffscreen] = useState(false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);

    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const;
    events.forEach(e => window.addEventListener(e, wake, { passive: true }));

    let io: IntersectionObserver | undefined;
    if (ref.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
      io.observe(ref.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      events.forEach(e => window.removeEventListener(e, wake));
      window.clearTimeout(timer);
      io?.disconnect();
    };
  }, [ref]);

  return hidden || offscreen || idle;
}
