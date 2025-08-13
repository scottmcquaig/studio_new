import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

export function getAdminDb(): admin.firestore.Firestore {
  if (admin.apps.length > 0 && adminDb) {
    return adminDb;
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountString) {
      throw new Error('Firebase Admin SDK credentials not found. Please provide FIREBASE_SERVICE_ACCOUNT in your .env file.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    adminDb = admin.firestore();
    return adminDb;
    
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
    // Re-throw the specific error to provide better context to the caller
    throw new Error(error.message || 'Failed to initialize Firebase Admin SDK.');
  }
}
