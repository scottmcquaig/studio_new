require('dotenv').config();
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let db: Firestore;
let initializationError: Error | null = null;

try {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccount = serviceAccountEnv ? JSON.parse(serviceAccountEnv) : undefined;

  const hasServiceAccount = !!serviceAccount;
  const hasEnvVars = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

  if (!hasServiceAccount && !hasEnvVars) {
    initializationError = new Error("Firebase Admin SDK credentials not found. Please provide FIREBASE_SERVICE_ACCOUNT or individual Firebase environment variables in your .env file.");
  } else {
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert(
          serviceAccount || {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }
        ),
      }, 'admin');
    } else {
      app = getApp('admin');
    }
  }
} catch (error: any) {
  console.error("Firebase Admin SDK initialization error:", error);
  initializationError = new Error(`Firebase Admin SDK failed to initialize: ${error.message}`);
}


if (app) {
  db = getFirestore(app);
} else {
  // If the app isn't initialized, create a dummy db object that will throw a clear error.
  const errorMessage = initializationError?.message || "Firebase Admin SDK could not be initialized for an unknown reason. Ensure Firestore is enabled in your Firebase project.";
  console.error(errorMessage);
  
  db = new Proxy({} as Firestore, {
    get(target, prop) {
      // For any method call on db, throw the initialization error.
      throw new Error(`Firestore call failed: ${errorMessage}`);
    }
  });
}

export { db };
