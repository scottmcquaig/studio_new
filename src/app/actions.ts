'use server';

import { getSiteSettings, saveSiteSettings, type SiteSettings } from '@/lib/firestore';

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
