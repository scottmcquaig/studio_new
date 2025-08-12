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
    <path d="M20 7H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" />
    <path d="M12 11v6" />
    <path d="M16 11v6" />
    <path d="M8 11v6" />
    <path d="M12 2v5" />
    <path d="M9 2h6" />
    <path d="M17 2l2 2" />
    <path d="M7 2L5 4" />
  </svg>
);
