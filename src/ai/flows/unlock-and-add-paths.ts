
'use server';

/**
 * @fileOverview A flow to add newly unlocked paths to a user's profile and burn the code.
 * 
 * - unlockAndAddPaths - Updates user doc and access code doc.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, Timestamp, arrayUnion, writeBatch, collection, increment } from 'firebase/firestore';
import { z } from 'zod';

const UnlockAndAddPathsInputSchema = z.object({
  uid: z.string().describe("The user's unique ID."),
  pathsToAdd: z.array(z.string()).describe("An array of new track IDs to add to the user's unlocked paths."),
  unlockCode: z.string().describe("The code being used to unlock these paths."),
});

const UnlockAndAddPathsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function unlockAndAddPaths(input: z.infer<typeof UnlockAndAddPathsInputSchema>): Promise<z.infer<typeof UnlockAndAddPathsOutputSchema>> {
  return unlockAndAddPathsFlow(input);
}

const unlockAndAddPathsFlow = ai.defineFlow(
  {
    name: 'unlockAndAddPathsFlow',
    inputSchema: UnlockAndAddPathsInputSchema,
    outputSchema: UnlockAndAddPathsOutputSchema,
  },
  async ({ uid, pathsToAdd, unlockCode }) => {
    const userDocRef = doc(db, 'users', uid);
    const codeDocRef = doc(db, 'accessCodes', unlockCode);
    
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error("User profile not found.");
    }
    const userData = userDoc.data();
    
    const batch = writeBatch(db);

    // Don't add paths if the user already has 'all' access
    if (userData.unlockedPaths !== 'all') {
        // Update user's unlockedPaths
        batch.update(userDocRef, {
            unlockedPaths: arrayUnion(...pathsToAdd)
        });
    }
    
    // Burn the code
    batch.update(codeDocRef, {
      isClaimed: true,
      claimedBy: uid,
      claimedAt: Timestamp.now(),
      useCount: increment(1),
    });

    // Create transaction log
    const transactionDocRef = doc(collection(db, 'transactions'));
    batch.set(transactionDocRef, {
        transactionId: transactionDocRef.id,
        timestamp: Timestamp.now(),
        type: 'access_code_redemption',
        userId: uid,
        details: {
            accessCode: unlockCode,
            unlockedPaths: pathsToAdd,
            isNewUser: false,
        }
    });

    await batch.commit();

    return {
      success: true,
      message: "Successfully unlocked new paths and claimed the code.",
    };
  }
);
