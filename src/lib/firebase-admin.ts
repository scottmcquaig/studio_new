import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

function initializeAdmin() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Firebase Admin SDK credentials not found. Please provide FIREBASE_SERVICE_ACCOUNT in your .env file.');
  }
  
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e: any) {
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string. Raw parsing error: ${e.message}`);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  adminDb = admin.firestore();
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    try {
      initializeAdmin();
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      throw new Error(error.message || 'Failed to initialize Firebase Admin SDK.');
    }
  }
  return adminDb;
}
