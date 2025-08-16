
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// This is a server-only file. The service account credentials are not exposed to the client.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // This will work for local development when FIREBASE_SERVICE_ACCOUNT is not set.
    // It uses Application Default Credentials or connects to the emulator.
    console.log('Initializing Firebase Admin SDK for local development/emulator.');
    initializeApp();
  }
}

const authAdmin = getAuth();
const dbAdmin = getFirestore();

interface InviteUserParams {
    email: string;
    displayName: string;
}

export async function inviteUser(params: InviteUserParams): Promise<{ success: boolean; error?: string }> {
    const { email, displayName } = params;

    try {
        // 1. Check if user already exists in Auth
        try {
            const existingUser = await authAdmin.getUserByEmail(email);
            if (existingUser) {
                return { success: false, error: 'A user with this email already exists.' };
            }
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error; // Re-throw unexpected errors
            }
            // If user-not-found, we can proceed.
        }

        // 2. Create user in Firebase Auth
        const userRecord = await authAdmin.createUser({
            email,
            displayName,
            emailVerified: false, // Will be verified when they set password
            disabled: false,
        });

        // 3. Create user document in Firestore with 'pending' status
        await dbAdmin.collection('users').doc(userRecord.uid).set({
            displayName,
            email,
            role: 'player', // Default role for new invites
            status: 'pending',
            createdAt: new Date().toISOString(),
        });

        // 4. Generate a password reset link (used for initial password setup)
        // Note: For this to actually SEND an email, you need to have SMTP settings configured
        // in your Firebase project. By default, it just generates the link.
        const link = await authAdmin.generatePasswordResetLink(email);

        // In a real app, you would use an email service (like SendGrid, Mailgun)
        // to send a nicely formatted invitation email with this link.
        console.log(`Password setup link for ${email}: ${link}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error in inviteUser action:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
