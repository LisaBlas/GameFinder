import React, { useCallback, useEffect, useRef, useState } from 'react';

interface FantasyScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  viewportClassName?: string;
}

const FantasyScrollArea: React.FC<FantasyScrollAreaProps> = ({
  children,
  className = '',
  viewportClassName = '',
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startY: number; startScrollTop: number } | null>(null);
  const [thumb, setThumb] = useState({ visible: false, height: 0, top: 0 });

  const updateThumb = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const railInset = 8;
    const railHeight = Math.max(0, viewport.clientHeight - railInset * 2);
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    if (maxScroll === 0 || railHeight === 0) {
      setThumb({ visible: false, height: 0, top: railInset });
      return;
    }

    const height = Math.max(38, railHeight * (viewport.clientHeight / viewport.scrollHeight));
    const travel = Math.max(0, railHeight - height);
    const top = railInset + travel * (viewport.scrollTop / maxScroll);
    setThumb({ visible: true, height, top });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    updateThumb();
    const observer = new ResizeObserver(updateThumb);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener('scroll', updateThumb, { passive: true });

    return () => {
      observer.disconnect();
      viewport.removeEventListener('scroll', updateThumb);
    };
  }, [updateThumb]);

  const moveThumb = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const viewport = viewportRef.current;
    if (!drag || !viewport || drag.pointerId !== event.pointerId) return;

    const railHeight = Math.max(0, viewport.clientHeight - 16);
    const travel = Math.max(1, railHeight - thumb.height);
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    viewport.scrollTop = drag.startScrollTop + ((event.clientY - drag.startY) / travel) * maxScroll;
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return (
    <div className={`fantasy-scroll-area min-h-0 flex-1 ${className}`}>
      <div
        ref={viewportRef}
        className={`fantasy-scroll-viewport h-full overflow-y-auto pr-5 ${viewportClassName}`}
      >
        <div>{children}</div>
      </div>
      {thumb.visible && (
        <div
          className="fantasy-scrollbar"
          aria-hidden="true"
          onPointerMove={moveThumb}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <div className="fantasy-scroll-track" />
          <div
            className="fantasy-scroll-thumb"
            style={{ height: `${thumb.height}px`, top: `${thumb.top}px` }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startScrollTop: viewportRef.current?.scrollTop ?? 0,
              };
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FantasyScrollArea;
