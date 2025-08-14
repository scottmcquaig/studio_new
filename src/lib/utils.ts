
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Contestant } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getContestantDisplayName(
  contestant: Contestant | undefined | null,
  format: 'full' | 'short'
): string {
  if (!contestant) {
    return 'Unknown';
  }

  if (format === 'full') {
    if (contestant.nickname) {
      return `${contestant.firstName} "${contestant.nickname}" ${contestant.lastName}`;
    }
    return `${contestant.firstName} ${contestant.lastName}`;
  }

  if (format === 'short') {
    return contestant.nickname || contestant.firstName;
  }

  return contestant.firstName;
}
