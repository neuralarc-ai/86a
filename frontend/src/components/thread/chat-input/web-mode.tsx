import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Globe SVG as a React component
const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-globe-icon lucide-globe"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

export const WebModeButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F7F7F726]"
          {...props}
        >
          <GlobeIcon className="h-5 w-5" style={{ width: 18, height: 18 }} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Web search</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
