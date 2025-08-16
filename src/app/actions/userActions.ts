'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// This initialization is for server-side operations.
// In a Google Cloud environment (like Firebase Functions or Cloud Run),
// it will automatically use Application Default Credentials.
if (!getApps().length) {
  initializeApp();
}

const dbAdmin = getFirestore();

interface CreateUserDocumentParams {
    uid: string;
    email: string;
    displayName: string;
}

export async function createUserDocument(params: CreateUserDocumentParams): Promise<{ success: boolean; error?: string }> {
    const { uid, email, displayName } = params;

    try {
        // Create user document in Firestore with 'active' status and 'player' role
        await dbAdmin.collection('users').doc(uid).set({
            displayName,
            email,
            role: 'player', // Default role for new sign-ups
            status: 'active',
            createdAt: new Date().toISOString(),
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error in createUserDocument action:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
