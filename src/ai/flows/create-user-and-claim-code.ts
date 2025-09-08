
'use server';

/**
 * @fileOverview A flow to create a user profile document and claim an unlock code.
 *
 * - createUserAndClaimCode - Creates a user profile, snapshots their challenge path, and marks the code as claimed.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { CreateUserAndClaimCodeInput, CreateUserAndClaimCodeInputSchema, CreateUserAndClaimCodeOutput, CreateUserAndClaimCodeOutputSchema } from '@/lib/types';
import { doc, setDoc, updateDoc, Timestamp, collection, writeBatch, increment, getDoc } from 'firebase/firestore';
import { challenges as allChallenges } from '@/lib/challenges';
import { tracks as allTracks } from '@/lib/tracks.json';
import { format } from 'date-fns';


export async function createUserAndClaimCode(input: CreateUserAndClaimCodeInput): Promise<CreateUserAndClaimCodeOutput> {
    return createUserAndClaimCodeFlow(input);
}


const createUserAndClaimCodeFlow = ai.defineFlow(
    {
        name: 'createUserAndClaimCodeFlow',
        inputSchema: CreateUserAndClaimCodeInputSchema,
        outputSchema: CreateUserAndClaimCodeOutputSchema,
    },
    async (input) => {
        const { uid, selectedTrackId, unlockedPaths, reminders, unlockCode } = input;
        const batch = writeBatch(db);

        // 1. Create the user document in the 'users' collection
        const userDocRef = doc(db, 'users', uid);
        const today = new Date();
        const activeChallengePath = `${selectedTrackId}_${format(today, 'yyyy-MM-dd')}`;

        batch.set(userDocRef, {
            activePath: selectedTrackId,
            activeChallengePath: activeChallengePath,
            unlockedPaths,
            reminders,
            createdAt: Timestamp.now(),
        });
        
        // 2. Snapshot the challenges and progress for the user
        const selectedTrack = allTracks.find(t => t.id === selectedTrackId);
        if (selectedTrack) {
            const trackChallenges = allChallenges.filter(c => c.track === selectedTrack.display_name);
            
            const userChallengeCollectionRef = collection(db, 'users', uid, activeChallengePath);

            // Snapshot each day's challenge
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
        }


        // 3. If an unlock code was used, "burn" it and log transaction
        if (unlockCode) {
            const codeDocRef = doc(db, 'accessCodes', unlockCode);
            batch.update(codeDocRef, {
                isClaimed: true,
                claimedBy: uid,
                claimedAt: Timestamp.now(),
                useCount: increment(1),
            });

            // 4. Create transaction log
            const transactionDocRef = doc(collection(db, 'transactions'));
            batch.set(transactionDocRef, {
                transactionId: transactionDocRef.id,
                timestamp: Timestamp.now(),
                type: 'access_code_redemption',
                userId: uid,
                details: {
                    accessCode: unlockCode,
                    unlockedPaths: unlockedPaths,
                    isNewUser: true,
                }
            });
        }
        
        await batch.commit();

        return {
            success: true,
            message: "User profile created and code claimed successfully."
        };
    }
);
