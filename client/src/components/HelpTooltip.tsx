import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface HelpTooltipProps {
  title: string;
  content: string;
  className?: string;
  isExpanded?: boolean;
}

export function HelpTooltip({ title, content, className = '', isExpanded = false }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // For SEO purposes
  const seoContent = `
    <div>
      <h3>${title}</h3>
      <p>${content}</p>
    </div>
  `;

  const tooltipContent = (
    <div className="w-[300px] p-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-50">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm leading-relaxed">{content}</p>
    </div>
  );

  // Handle click outside to close tooltip on mobile
  useEffect(() => {
    // Only run this effect for mobile devices
    if (!isMobile || !isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && 
          buttonRef.current && 
          !tooltipRef.current.contains(event.target as Node) && 
          !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);
  
  // On mobile: Use manual open/close with state
  // On desktop: Use hover behavior from Radix UI
  if (isMobile) {
    
    return (
      <div className={`${className}`} style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
        {/* Hidden SEO content */}
        <span className="sr-only" dangerouslySetInnerHTML={{ __html: seoContent }} />
        
        <div className="relative">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            className="hover:bg-muted/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          
          {isOpen && (
            <div 
              ref={tooltipRef}
              className="absolute top-full right-0 mt-2 w-[300px] p-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm leading-relaxed">{content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Desktop version: Use hover behavior
  return (
    <div className={`${className}`} style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
      {/* Hidden SEO content */}
      <span className="sr-only" dangerouslySetInnerHTML={{ __html: seoContent }} />
      
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted/50"
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" onClick={(e) => e.stopPropagation()}>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
