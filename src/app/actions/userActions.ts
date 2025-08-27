
'use server';

import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// This function ensures the Firebase Admin SDK is initialized.
// It prevents re-initialization which can cause errors.
if (getApps().length === 0) {
  // When deployed to a Google Cloud environment, the SDK can automatically
  // discover the service account credentials.
  initializeApp();
}

/**
 * Creates a new user document in Firestore with a 'pending' status.
 * This function is intended to be called from a secure environment (e.g., a server action).
 * @param {object} data - The user data.
 * @param {string} data.displayName - The user's display name.
 * @param {string} data.email - The user's email address.
 * @returns {Promise<{success: boolean, uid?: string, error?: string}>}
 */
export async function inviteUser(data: { displayName: string, email: string }) {
  try {
    const db = getFirestore();
    
    // Create the user document in Firestore with 'pending' status
    const userDocRef = await addDoc(collection(db, 'users'), {
      email: data.email,
      displayName: data.displayName,
      role: 'player', // Default role for new users
      status: 'pending', // User is pending until they sign up
      createdAt: new Date().toISOString(),
    });

    // In a real app, you would now trigger an email send to this user
    // with a link to the signup page. For now, we just create the record.
    console.log(`Created pending user record for ${data.email} with ID: ${userDocRef.id}`);

    return { success: true, uid: userDocRef.id };

  } catch (error: any) {
    console.error("Error in inviteUser action:", error);
    const message = error.message || 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
