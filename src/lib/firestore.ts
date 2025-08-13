import { adminDb } from './firebase-admin';

export interface SiteSettings {
    leagueName: string;
    [key: string]: any;
}

const SITE_SETTINGS_DOC_ID = 'site_config';

/**
 * Retrieves the site settings from Firestore.
 * If the settings document doesn't exist, it creates it with default values.
 * @returns {Promise<SiteSettings>} The site settings.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const settingsDocRef = adminDb.collection('settings').doc(SITE_SETTINGS_DOC_ID);
        const docSnap = await settingsDocRef.get();

        if (docSnap.exists) {
            return docSnap.data() as SiteSettings;
        } else {
            // Document doesn't exist, create it with default values
            const defaultSettings: SiteSettings = {
                leagueName: 'YAC Fantasy League',
            };
            await settingsDocRef.set(defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error getting site settings: ", error);
        throw new Error("Firestore call failed: " + (error as Error).message);
    }
}

/**
 * Saves the site settings to Firestore.
 * @param {Partial<SiteSettings>} settings - The settings to save.
 * @returns {Promise<void>}
 */
export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
    try {
        const settingsDocRef = adminDb.collection('settings').doc(SITE_SETTINGS_DOC_ID);
        await settingsDocRef.set(settings, { merge: true });
    } catch (error) {
        console.error("Error saving site settings: ", error);
        throw new Error("Firestore call failed: " + (error as Error).message);
    }
}
