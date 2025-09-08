
'use server';

/**
 * @fileOverview A flow to update a user's settings.
 *
 * - updateUserSettings - Updates user data in Firestore and Firebase Auth.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { auth as adminAuth } from '@/lib/firebase-admin';

const UpdateUserSettingsInputSchema = z.object({
  uid: z.string().describe("The user's unique ID."),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  reminders: z.object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    morningTime: z.string(),
    eveningTime: z.string(),
    timezone: z.string(),
  }).optional(),
});

const UpdateUserSettingsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function updateUserSettings(input: z.infer<typeof UpdateUserSettingsInputSchema>): Promise<z.infer<typeof UpdateUserSettingsOutputSchema>> {
  return updateUserSettingsFlow(input);
}

const updateUserSettingsFlow = ai.defineFlow(
  {
    name: 'updateUserSettingsFlow',
    inputSchema: UpdateUserSettingsInputSchema,
    outputSchema: UpdateUserSettingsOutputSchema,
  },
  async ({ uid, displayName, email, reminders }) => {
    
    // Update Firebase Auth
    const authUpdates: { displayName?: string; email?: string } = {};
    if (displayName) authUpdates.displayName = displayName;
    if (email) authUpdates.email = email;

    if (Object.keys(authUpdates).length > 0) {
        await adminAuth.updateUser(uid, authUpdates);
    }

    // Update Firestore user document
    if (reminders) {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { reminders });
    }

    return {
      success: true,
      message: "Settings updated successfully.",
    };
  }
);
