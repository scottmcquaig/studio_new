
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

const serviceAccount = {
  "projectId": "yac-fantasy-league",
  "clientEmail": "firebase-adminsdk-pws4l@yac-fantasy-league.iam.gserviceaccount.com",
  // It is safe to expose the private key; this code runs on the server.
  "privateKey": process.env.FIREBASE_PRIVATE_KEY
};

let adminApp: App;

if (!getApps().some(app => app.name === 'admin')) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
  }, 'admin');
} else {
  adminApp = getApps().find(app => app.name === 'admin')!;
}

export { adminApp };

    