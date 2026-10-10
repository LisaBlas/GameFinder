/**
 * Including a keyword from the map sends one restrained light pulse from the
 * node to the search tray (docs/MAP_FEATURE.md, "Semantic motion"), so the
 * user sees where their pick went. DOM-only, one element, removed when done.
 */

const TRAY_SELECTORS = ['.kmap-user-selection-filters'];

const visibleRect = (el: Element | null) => {
  const r = el?.getBoundingClientRect();
  return r && r.width > 0 && r.height > 0 ? r : null;
};

export function sendLightPulse(from: Element | null) {
  if (typeof window === 'undefined' || !from) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = visibleRect(from);
  if (!start) return;

  // The tray may only appear once this pick lands in the selection: look after the next paint.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = TRAY_SELECTORS.map(s => visibleRect(document.querySelector(s))).find(Boolean);
      if (!target) return;
      const dot = document.createElement('div');
      dot.className = 'kmap-light';
      const x0 = start.left + start.width / 2;
      const y0 = start.top + start.height / 2;
      dot.style.left = `${x0}px`;
      dot.style.top = `${y0}px`;
      document.body.appendChild(dot);
      const dx = target.left + Math.min(target.width / 2, 48) - x0;
      const dy = target.top + target.height / 2 - y0;
      const anim = dot.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.95 },
          { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55 - 24}px)) scale(0.8)`, opacity: 0.85, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.35)`, opacity: 0 },
        ],
        { duration: 620, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
      );
      anim.onfinish = anim.oncancel = () => dot.remove();
    }),
  );
}
