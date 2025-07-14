import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Link SVG as a React component
const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    className="lucide lucide-link2-icon lucide-link-2"
    {...props}
  >
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" x2="16" y1="12" y2="12" />
  </svg>
);

export const ConnectButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
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
          <LinkIcon className="h-5 w-5" style={{ width: 18, height: 18 }} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Connect</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
