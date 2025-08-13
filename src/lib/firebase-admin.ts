import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// To connect to a real Firebase project, you must provide one of two things:
// 1. A FIREBASE_SERVICE_ACCOUNT environment variable with the JSON content of your service account key.
// 2. Individual environment variables for FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.
// These should be placed in a .env.local file at the root of your project.

let app: App | undefined;
let db: Firestore;
let initializationError: Error | null = null;

try {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccount = serviceAccountEnv ? JSON.parse(serviceAccountEnv) : undefined;

  const hasServiceAccount = !!serviceAccount;
  const hasEnvVars = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

  if (hasServiceAccount || hasEnvVars) {
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert(
          serviceAccount || {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }
        ),
      }, 'admin');
    } else {
      app = getApp('admin');
    }
  } else {
    // This case is for when no credentials are provided at all.
    initializationError = new Error("Firebase Admin SDK credentials are not set. Please provide FIREBASE_SERVICE_ACCOUNT or individual Firebase environment variables in your .env.local file.");
  }
} catch (error: any) {
  console.error("Firebase Admin SDK initialization error:", error);
  initializationError = error;
}


if (app) {
  db = getFirestore(app);
} else {
  // If the app isn't initialized, create a dummy db object that will throw a clear error.
  const errorMessage = initializationError?.message || "Firebase Admin SDK not initialized. Please check your .env.local file for credentials and ensure Firestore is enabled in your Firebase project.";
  console.warn(errorMessage);
  
  db = new Proxy({} as Firestore, {
    get(target, prop) {
      // For any method call on db, throw the initialization error.
      throw new Error(`Firestore call failed: ${errorMessage}`);
    }
  });
}

export { db };
