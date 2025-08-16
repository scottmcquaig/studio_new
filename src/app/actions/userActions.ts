
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// This function initializes the Firebase Admin SDK.
// It ensures that initialization happens only once.
function initializeAdmin() {
  if (getApps().length > 0) {
    return;
  }

  // When deployed to a Google Cloud environment, the SDK can automatically
  // discover the service account credentials. In other environments, you may
  // need to provide credentials explicitly.
  initializeApp();
}

/**
 * Invites a new user by creating an account and sending a password reset email.
 * This function is intended to be called from a secure environment (e.g., a server action).
 * @param {object} data - The user data.
 * @param {string} data.displayName - The user's display name.
 * @param {string} data.email - The user's email address.
 * @returns {Promise<{success: boolean, uid?: string, error?: string}>}
 */
export async function inviteUser(data: { displayName: string, email: string }) {
  try {
    initializeAdmin();

    const auth = getAuth();
    const db = getFirestore();

    // 1. Create the user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: data.email,
      displayName: data.displayName,
      emailVerified: false, // Will be verified when they set password
    });

    // 2. Create the corresponding user document in Firestore with 'pending' status
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      email: data.email,
      displayName: data.displayName,
      role: 'player', // Default role for new users
      status: 'pending', // User must set password to become 'active'
      createdAt: new Date().toISOString(),
    });

    // 3. Generate a password reset link (which serves as the "set password" link)
    const link = await auth.generatePasswordResetLink(data.email);
    
    // In a real app, you would use a service like SendGrid, Resend, or Firebase Trigger Email
    // to send this link to the user. For this example, we'll log it to the server console.
    console.log(`Password reset/activation link for ${data.email}: ${link}`);
    
    // The link is automatically sent by Firebase if you have the email template enabled.

    return { success: true, uid: userRecord.uid };

  } catch (error: any) {
    console.error("Error in inviteUser action:", error);
    // Provide a more user-friendly error message
    const message = error.code === 'auth/email-already-exists'
      ? 'A user with this email already exists.'
      : error.message || 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
