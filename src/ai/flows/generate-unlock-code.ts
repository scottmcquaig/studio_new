
'use server';

/**
 * @fileOverview A flow to generate and store one-time unlock codes for users.
 *
 * - generateUnlockCode - Creates a unique code and saves it to Firestore.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { GenerateUnlockCodeInput, GenerateUnlockCodeInputSchema, GenerateUnlockCodeOutput, GenerateUnlockCodeOutputSchema } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper function to generate a formatted random code
const generateCode = (): string => {
  const segment = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${segment()}-${segment()}-${segment()}`;
};

// Main exported function that the client will call
export async function generateUnlockCode(input: GenerateUnlockCodeInput): Promise<GenerateUnlockCodeOutput> {
  return generateUnlockCodeFlow(input);
}

const generateUnlockCodeFlow = ai.defineFlow(
  {
    name: 'generateUnlockCodeFlow',
    inputSchema: GenerateUnlockCodeInputSchema,
    outputSchema: GenerateUnlockCodeOutputSchema,
  },
  async (input) => {
    let code: string;
    let codeExists = true;

    // Ensure the generated code is unique
    do {
      code = generateCode();
      const codeDocRef = doc(db, 'accessCodes', code);
      const docSnap = await getDoc(codeDocRef);
      codeExists = docSnap.exists();
    } while (codeExists);

    // Save the new code to Firestore
    const newCodeDocRef = doc(db, 'accessCodes', code);
    await setDoc(newCodeDocRef, {
      accessType: input.accessType,
      paths: input.paths,
      isClaimed: false,
      isMultiUse: input.isMultiUse || false,
      useCount: 0,
      createdAt: new Date().toISOString(),
    });

    return {
      code,
      accessType: input.accessType,
    };
  }
);
