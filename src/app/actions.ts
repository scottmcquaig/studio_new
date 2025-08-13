'use server';

import { getSiteSettings, saveSiteSettings } from '@/lib/firestore';
import type { SiteSettings } from '@/lib/data';

export async function getSettings(): Promise<SiteSettings> {
    try {
        return await getSiteSettings();
    } catch (error: any) {
        console.error("Error getting settings, returning default. The raw error is:", error);
        // Return default settings on error to prevent app crash
        return { leagueName: 'YAC Fantasy League' };
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
