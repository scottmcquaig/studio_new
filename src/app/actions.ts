'use server';

import { generateLeagueDescription, type GenerateLeagueDescriptionInput } from '@/ai/flows/generate-league-description';
import { getSiteSettings, saveSiteSettings, type SiteSettings } from '@/lib/firestore';

// This function is commented out as it requires a database connection which has been removed.
// export async function getLeagueDescription(input: GenerateLeagueDescriptionInput): Promise<string> {
//   try {
//     const result = await generateLeagueDescription(input);
//     return result.description;
//   } catch (error) {
//     console.error("Error generating league description:", error);
//     throw new Error("Failed to generate league description.");
//   }
// }


export async function getSettings(): Promise<SiteSettings> {
    try {
        return await getSiteSettings();
    } catch (error: any) {
        console.error("Error getting settings. The raw error is:", error);
        throw new Error(`Failed to get settings: ${error.message}`);
    }
}

export async function saveSettings(settings: Partial<SiteSettings>): Promise<void> {
    try {
        await saveSiteSettings(settings);
    } catch (error: any) {
        console.error("Error saving settings. The raw error is:", error);
        throw new Error(`Failed to save settings: ${error.message}`);
    }
}
