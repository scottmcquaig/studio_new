import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("text-primary", className)}
    aria-label="YAC Fantasy League Logo"
  >
    <path d="M15.5 2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z M8.5 2.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    <path d="M15.15 4.62 13 7h-2L8.85 4.62A5.22 5.22 0 0 1 7.3 4.5a4.79 4.79 0 0 1-2.22-.67C4.1 3.33 3 4.23 3 5.38v.83c0 .32.03.63.1.93l.96 4.13c.4 1.74 1.93 3 3.74 3h8.4c1.8 0 3.34-1.26 3.74-3l.96-4.13c.07-.3.1-.6.1-.93v-.83c0-1.15-1.1-2.05-2.08-1.55a4.79 4.79 0 0 1-2.22.67c-.57.02-1.12-.1-1.65-.38Z M9 10a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1Z" />
  </svg>
);