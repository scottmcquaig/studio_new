

export interface Challenge {
  day: number;
  title: string;
  description: string;
  quote: {
    text: string;
    author: string;
  };
  badgeTitle?: string;
  broTranslation?: string;
  challenge?: string;
  morningPrompt?: string;
  eveningPrompt?: string;
  winsTitle?: string;
  week?: number;
  track?: string;
}

export interface UserChallenge extends Challenge {
    isComplete: boolean;
    completedAt: Date | null;
    lastEditedAt: Date | null;
    entries: {
        morning: string;
        evening: string;
        wins: string;
    }
}

export interface JournalEntry {
  morning: string;
  evening: string;
  wins: string;
}

import { z } from 'zod';

export const GenerateUnlockCodeInputSchema = z.object({
  accessType: z.enum(['userOne', 'adminOne', 'adminMulti', 'allCurrent', 'allEvergreen']),
  paths: z.union([z.array(z.string()), z.literal('all')]).describe('Array of track IDs or "all".'),
  isMultiUse: z.boolean().optional().describe('Whether the code can be used multiple times.'),
});
export type GenerateUnlockCodeInput = z.infer<typeof GenerateUnlockCodeInputSchema>;

export const GenerateUnlockCodeOutputSchema = z.object({
  code: z.string().describe('The generated unique unlock code.'),
  accessType: z.string(),
});
export type GenerateUnlockCodeOutput = z.infer<typeof GenerateUnlockCodeOutputSchema>;


// Schema for validating an unlock code
export const ValidateUnlockCodeInputSchema = z.object({
  code: z.string().describe('The unlock code to validate.'),
});
export type ValidateUnlockCodeInput = z.infer<typeof ValidateUnlockCodeInputSchema>;

export const ValidateUnlockCodeOutputSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  accessType: z.string().optional(),
  paths: z.union([z.array(z.string()), z.literal('all')]).optional(),
  isMultiUse: z.boolean().optional(),
});
export type ValidateUnlockCodeOutput = z.infer<typeof ValidateUnlockCodeOutputSchema>;
export type ValidatedCode = ValidateUnlockCodeOutput;

// Schema for creating user profile and claiming a code
export const CreateUserAndClaimCodeInputSchema = z.object({
    uid: z.string().describe("The user's unique ID from Firebase Auth."),
    selectedTrackId: z.string().describe("The ID of the track the user selected."),
    unlockedPaths: z.union([z.array(z.string()), z.literal('all')]).describe("The paths to unlock for the user."),
    reminders: z.object({
        pushEnabled: z.boolean(),
        emailEnabled: z.boolean(),
        morningTime: z.string(),
        eveningTime: z.string(),
        timezone: z.string(),
    }),
    unlockCode: z.string().nullable().describe("The unlock code used, if any.")
});
export type CreateUserAndClaimCodeInput = z.infer<typeof CreateUserAndClaimCodeInputSchema>;

export const CreateUserAndClaimCodeOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});
export type CreateUserAndClaimCodeOutput = z.infer<typeof CreateUserAndClaimCodeOutputSchema>;
