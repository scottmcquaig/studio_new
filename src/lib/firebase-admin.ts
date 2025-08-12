import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const app: App = getApps().length
  ? getApp('admin')
  : initializeApp(
      {
        credential: cert(
          serviceAccount || {
            project_id: process.env.FIREBASE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }
        ),
      },
      'admin'
    );

const db = getFirestore(app);

export { db };
