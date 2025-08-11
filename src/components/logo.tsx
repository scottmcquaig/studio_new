import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 128 128"
    className={cn("text-primary", className)}
    aria-label="YAC Fantasy League Logo"
  >
    <g fill="currentColor">
      {/* TV Body */}
      <path d="M112,36H16a8,8,0,0,0-8,8V96a8,8,0,0,0,8,8H112a8,8,0,0,0,8-8V44A8,8,0,0,0,112,36Zm0,60H16V44H112Z" />
      {/* Screen */}
      <rect x="24" y="52" width="80" height="40" rx="4" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
       {/* Trash Can Lid Handle */}
      <path d="M72,12H56a4,4,0,0,0,0,8H72a4,4,0,0,0,0-8Z" />
      {/* Trash Can Lid */}
      <path d="M96,24H32a4,4,0,0,0-4,4v4H100V28A4,4,0,0,0,96,24Z" />
      {/* TV Legs */}
      <path d="M40,104l-8,12a4,4,0,0,0,6.92,4L48,108Z" />
      <path d="M88,104l8,12a4,4,0,0,1-6.92,4L80,108Z" />
    </g>
  </svg>
);