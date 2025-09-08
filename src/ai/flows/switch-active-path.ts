
'use server';

/**
 * @fileOverview A flow to switch a user's active challenge path.
 *
 * - switchActivePath - Updates the active path and snapshots the new challenge.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, writeBatch } from 'firebase/firestore';
import { z } from 'zod';
import { challenges as allChallenges } from '@/lib/challenges';
import { tracks as allTracks } from '@/lib/tracks.json';
import { format } from 'date-fns';

const SwitchActivePathInputSchema = z.object({
  uid: z.string().describe("The user's unique ID."),
  newTrackId: z.string().describe("The ID of the new track to make active."),
});

const SwitchActivePathOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function switchActivePath(input: z.infer<typeof SwitchActivePathInputSchema>): Promise<z.infer<typeof SwitchActivePathOutputSchema>> {
  return switchActivePathFlow(input);
}

const switchActivePathFlow = ai.defineFlow(
  {
    name: 'switchActivePathFlow',
    inputSchema: SwitchActivePathInputSchema,
    outputSchema: SwitchActivePathOutputSchema,
  },
  async ({ uid, newTrackId }) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User profile not found.");
    }

    const userData = userDoc.data();
    const isUnlocked = userData.unlockedPaths === 'all' || (Array.isArray(userData.unlockedPaths) && userData.unlockedPaths.includes(newTrackId));
    
    if (!isUnlocked) {
        throw new Error("User does not have access to this path.");
    }
    
    const today = new Date();
    const newActiveChallengePath = `${newTrackId}_${format(today, 'yyyy-MM-dd')}`;

    // 1. Update the active path in the user document
    await updateDoc(userDocRef, {
      activePath: newTrackId,
      activeChallengePath: newActiveChallengePath,
    });

    // 2. Snapshot the new challenge data and progress doc if it doesn't exist already
    const selectedTrack = allTracks.find(t => t.id === newTrackId);
    if (selectedTrack) {
        const trackChallenges = allChallenges.filter(c => c.track === selectedTrack.display_name);
        
        const userChallengeCollectionRef = collection(db, 'users', uid, newActiveChallengePath);
        const batch = writeBatch(db);

        // Snapshot each day
        trackChallenges.forEach(challenge => {
            const dayDocRef = doc(userChallengeCollectionRef, `day_${challenge.day}`);
            const userChallengeData = {
                ...challenge,
                isComplete: false,
                completedAt: null,
                lastEditedAt: null,
                entries: {
                    morning: "",
                    evening: "",
                    wins: "",
                }
            };
            batch.set(dayDocRef, userChallengeData);
        });

        // Create the progress document
        const progressDocRef = doc(userChallengeCollectionRef, 'progress');
        batch.set(progressDocRef, {
            currentDay: 1,
            completedDays: [],
            streak: 0,
            trackSettings: selectedTrack // Snapshot the track settings
        });

        await batch.commit();
    }

    return {
      success: true,
      message: "Successfully switched active challenge path.",
    };
  }
);
