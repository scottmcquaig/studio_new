
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// This function ensures the Firebase Admin SDK is initialized.
// It prevents re-initialization which can cause errors.
function initializeAdmin() {
  if (getApps().length === 0) {
    // When deployed to a Google Cloud environment, the SDK can automatically
    // discover the service account credentials. In other environments, you may
    // need to provide credentials explicitly. The modern SDK handles this
    // implicitly when a service like getAuth() or getFirestore() is called for the first time.
    initializeApp();
  }
}

/**
 * Creates a new user with a temporary password.
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
    
    // 1. Generate a secure temporary password
    const temporaryPassword = Math.random().toString(36).slice(-10);

    // 2. Create the user in Firebase Authentication with the temporary password
    const userRecord = await auth.createUser({
      email: data.email,
      displayName: data.displayName,
      password: temporaryPassword,
      emailVerified: true, // Or false, depending on desired flow
    });

    // 3. Create the corresponding user document in Firestore with 'active' status
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      email: data.email,
      displayName: data.displayName,
      role: 'player', // Default role for new users
      status: 'active', // User is active immediately
      createdAt: new Date().toISOString(),
    });
    
    // In a real app, you might want to log this temporary password securely or
    // have a process for the user to reset it on first login. For now, we log it.
    console.log(`Created user ${data.email} with temporary password: ${temporaryPassword}`);
    // A follow-up action could be to send a password reset email from the admin UI.

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
