import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("text-primary", className)}
    aria-label="YAC Fantasy League Logo"
  >
    {/* TV body */}
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
    {/* Trash can part */}
    <line x1="12" y1="2" x2="12" y2="7"></line>
    <line x1="8" y1="2" x2="16" y2="2"></line>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
    {/* Antennae */}
    <line x1="17" y1="2" x2="19" y2="4"></line>
    <line x1="7" y1="2" x2="5" y2="4"></line>
  </svg>
);
