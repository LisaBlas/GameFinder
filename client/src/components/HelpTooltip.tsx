import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface HelpTooltipProps {
  title: string;
  content: string;
  className?: string;
  isExpanded?: boolean;
}

export function HelpTooltip({ title, content, className = '', isExpanded = false }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    // Only add the event listener if the tooltip is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`${className}`} style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
      {/* Hidden SEO content */}
      <span className="sr-only" dangerouslySetInnerHTML={{ __html: seoContent }} />
      
      <Tooltip 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <TooltipTrigger asChild>
          <Button
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
        </TooltipTrigger>
        <TooltipContent onClick={(e) => e.stopPropagation()}>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
