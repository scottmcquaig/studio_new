require('dotenv').config();
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
    throw new Error('Firebase Admin SDK credentials not found. Please provide FIREBASE_SERVICE_ACCOUNT in your .env file.');
  }
}

export const adminDb = admin.firestore();
