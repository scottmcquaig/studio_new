
'use server';

/**
 * @fileOverview A flow to validate a user-provided unlock code.
 *
 * - validateUnlockCode - Checks Firestore for a valid, unclaimed code.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { ValidateUnlockCodeInputSchema, ValidateUnlockCodeOutputSchema } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

export async function validateUnlockCode(input: import('@/lib/types').ValidateUnlockCodeInput): Promise<import('@/lib/types').ValidateUnlockCodeOutput> {
    return validateUnlockCodeFlow(input);
}

const validateUnlockCodeFlow = ai.defineFlow(
  {
    name: 'validateUnlockCodeFlow',
    inputSchema: ValidateUnlockCodeInputSchema,
    outputSchema: ValidateUnlockCodeOutputSchema,
  },
  async ({ code }) => {
    const codeDocRef = doc(db, 'accessCodes', code);
    const docSnap = await getDoc(codeDocRef);

    if (!docSnap.exists()) {
      return {
        isValid: false,
        error: "Invalid code. Please check the code and try again. If you believe this is an error, please contact support@stoic-af.com for assistance.",
      };
    }

    const codeData = docSnap.data();

    if (codeData.isClaimed && !codeData.isMultiUse) {
      return {
        isValid: false,
        error: "This code has already been claimed. If you believe this is an error, please contact support@stoic-af.com for assistance.",
      };
    }

    return {
      isValid: true,
      accessType: codeData.accessType,
      paths: codeData.paths,
      isMultiUse: codeData.isMultiUse,
    };
  }
);
