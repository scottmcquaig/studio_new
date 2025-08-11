'use server';

import { generateLeagueDescription, type GenerateLeagueDescriptionInput } from '@/ai/flows/generate-league-description';

export async function getLeagueDescription(input: GenerateLeagueDescriptionInput): Promise<string> {
  try {
    const result = await generateLeagueDescription(input);
    return result.description;
  } catch (error) {
    console.error("Error generating league description:", error);
    throw new Error("Failed to generate league description.");
  }
}
