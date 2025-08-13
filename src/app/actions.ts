'use server';

import { generateLeagueDescription, type GenerateLeagueDescriptionInput } from '@/ai/flows/generate-league-description';
import { saveLeagueAndTeams } from '@/lib/firestore';
import type { League } from '@/lib/data';

export async function getLeagueDescription(input: GenerateLeagueDescriptionInput): Promise<string> {
  try {
    const result = await generateLeagueDescription(input);
    return result.description;
  } catch (error) {
    console.error("Error generating league description:", error);
    throw new Error("Failed to generate league description.");
  }
}

export async function saveSettings(league: League, teamNames: string[]): Promise<void> {
    try {
        await saveLeagueAndTeams(league, teamNames);
    } catch (error: any) {
        console.error("Error saving settings. The raw error is:", error);
        throw new Error(`Failed to save settings: ${error.message}`);
    }
}
