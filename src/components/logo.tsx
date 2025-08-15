import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("text-primary", className)}
    aria-label="YAC Fantasy League Logo"
  >
    {/* TV Body with a slight taper like a trash can */}
    <path d="M2 7a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z" />
    
    {/* TV Screen */}
    <rect x="5" y="9" width="14" height="8" rx="1" strokeWidth="1" />

    {/* Trash can lines, inside the TV body but outside the screen */}
    <line x1="8" y1="18" x2="8" y2="19" />
    <line x1="12" y1="18" x2="12" y2="19" />
    <line x1="16" y1="18" x2="16" y2="19" />
    <line x1="8" y1="6" x2="8" y2="7" />
    <line x1="12" y1="6" x2="12" y2="7" />
    <line x1="16" y1="6" x2="16" y2="7" />
    
    {/* Antennae */}
    <path d="m14 2-2 4-2-4" />
  </svg>
);
