import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('Firebase Admin SDK credentials not found. Please provide FIREBASE_SERVICE_ACCOUNT in your .env file.');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
    // Re-throw the specific error to provide better context to the caller
    throw new Error(error.message || 'Failed to initialize Firebase Admin SDK.');
  }
}

export const adminDb = admin.firestore();
