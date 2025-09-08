
'use server';

/**
 * @fileOverview A flow to retrieve a user's settings for the settings page.
 *
 * - getUserSettings - Fetches user data from both Firestore and Firebase Auth.
 */

import { ai } from '@/ai/genkit';
import { db, auth as clientAuth } from '@/lib/firebase'; // Using client auth for user lookup
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { auth as adminAuth } from '@/lib/firebase-admin';

const GetUserSettingsInputSchema = z.object({
  uid: z.string().describe("The user's unique ID."),
});

const GetUserSettingsOutputSchema = z.object({
    displayName: z.string().nullable(),
    email: z.string().nullable(),
    reminders: z.object({
        pushEnabled: z.boolean(),
        emailEnabled: z.boolean(),
        morningTime: z.string(),
        eveningTime: z.string(),
        timezone: z.string(),
    }),
});

export async function getUserSettings(input: z.infer<typeof GetUserSettingsInputSchema>): Promise<z.infer<typeof GetUserSettingsOutputSchema>> {
  return getUserSettingsFlow(input);
}

const getUserSettingsFlow = ai.defineFlow(
  {
    name: 'getUserSettingsFlow',
    inputSchema: GetUserSettingsInputSchema,
    outputSchema: GetUserSettingsOutputSchema,
  },
  async ({ uid }) => {
    // 1. Get user data from Firestore
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      throw new Error('User profile not found.');
    }
    const firestoreData = docSnap.data();

    // 2. Get user data from Firebase Auth
    const authUser = await adminAuth.getUser(uid);
    
    // 3. Combine and return
    return {
      displayName: authUser.displayName || null,
      email: authUser.email || null,
      reminders: firestoreData.reminders || {
        pushEnabled: false,
        emailEnabled: false,
        morningTime: '07:00',
        eveningTime: '21:00',
        timezone: 'America/New_York',
      },
    };
  }
);
