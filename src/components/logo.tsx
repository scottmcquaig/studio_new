import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("text-primary", className)}
    aria-label="YAC Fantasy League Logo"
  >
    <path
      d="M19.71,6.29,18,4.58V4a1,1,0,0,0-2,0V8.42L15.71,6.29a1,1,0,0,0-1.42,1.42L16.17,9.6A1,1,0,0,0,17,10a1,1,0,0,0,.71-.29l1.88-1.88A1,1,0,1,0,19.71,6.29Z"
    />
    <path
      d="M8.29,6.29,6,8.42V4A1,1,0,0,0,4,4V8.42L2.29,6.29A1,1,0,1,0,.88,7.71L2.76,9.59A1,1,0,0,0,3.47,10a1,1,0,0,0,.71-.29L6.88,7.71A1,1,0,1,0,8.29,6.29Z"
    />
    <path
      d="M19,11H5a1,1,0,0,0-1,1v9a1,1,0,0,0,1,1H19a1,1,0,0,0,1-1V12A1,1,0,0,0,19,11ZM8,20H6V14H8Zm5,0H11V14h2Zm5,0H16V14h2Z"
    />
  </svg>
);
