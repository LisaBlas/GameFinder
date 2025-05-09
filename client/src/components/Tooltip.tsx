import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg pointer-events-none transition-opacity duration-200 opacity-100">
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;