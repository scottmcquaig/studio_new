'use server';

import { generateLeagueDescription, type GenerateLeagueDescriptionInput } from '@/ai/flows/generate-league-description';
import { saveLeagueAndTeams, testWrite } from '@/lib/firestore';
import type { League, Team } from '@/lib/data';

export async function getLeagueDescription(input: GenerateLeagueDescriptionInput): Promise<string> {
  try {
    const result = await generateLeagueDescription(input);
    return result.description;
  } catch (error) {
    console.error("Error generating league description:", error);
    throw new Error("Failed to generate league description.");
  }
}

export async function saveSettings(league: League, teams: Team[]): Promise<void> {
    try {
        await saveLeagueAndTeams(league, teams);
    } catch (error: any) {
        console.error("Error saving settings. The raw error is:", error);
        throw new Error(`Failed to save settings: ${error.message}`);
    }
}

export async function testFirestoreWrite(): Promise<void> {
    try {
        await testWrite();
    } catch (error: any) {
        console.error("Error during test write. The raw error is:", error);
        throw new Error(`Failed to perform test write to Firestore: ${error.message}`);
    }
}
