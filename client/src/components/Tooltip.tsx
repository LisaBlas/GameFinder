import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  isMobile?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, isMobile = false }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.bottom + 8; // place below the anchor with small gap
    const left = rect.left + rect.width / 2; // center horizontally
    setPosition({ top, left });
  };

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible]);

  return (
    <span
      ref={anchorRef}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && position && createPortal(
        <span
          className="w-64 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg pointer-events-none transition-opacity duration-200 opacity-100"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            transform: "translateX(-50%)",
            zIndex: 9999
          }}
        >
          {content}
        </span>,
        document.body
      )}
    </span>
  );
};

export default Tooltip;