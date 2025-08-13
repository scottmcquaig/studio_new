
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function getAdminDb() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error('Firebase Admin SDK credentials not found. Please provide FIREBASE_SERVICE_ACCOUNT in your .env file.');
    }
    
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully.');
    return admin.firestore();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
    // Re-throw the specific error to provide better context to the caller
    throw new Error(`Firestore call failed: ${error.message}`);
  }
}

db = getAdminDb();

export { db };
