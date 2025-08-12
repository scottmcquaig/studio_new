import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// To connect to a real Firebase project, you must provide one of two things:
// 1. A FIREBASE_SERVICE_ACCOUNT environment variable with the JSON content of your service account key.
// 2. Individual environment variables for FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.
// These should be placed in a .env.local file at the root of your project.

let app: App | undefined;
let db: Firestore;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

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
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error);
  // We'll proceed without an initialized app, which will be handled below.
}

// @ts-ignore
if (app) {
  db = getFirestore(app);
} else {
  // If the app isn't initialized, we create a dummy db object that will prevent crashes,
  // but all operations on it will fail. This allows the app to run without credentials,
  // though Firestore-dependent features will not work.
  console.warn("Firebase Admin SDK not initialized. Firestore operations will not work. Please check your .env.local file.");
  db = {} as Firestore;
}

export { db };
