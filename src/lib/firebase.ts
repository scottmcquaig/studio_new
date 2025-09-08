import { initializeApp, getApps, getApp, App } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  projectId: "stoic-af",
  appId: "1:86800269179:web:8ea1e241b951c535e187de",
  storageBucket: "stoic-af.firebasestorage.app",
  apiKey: "AIzaSyDnfzl9ed_kg8F-OUegiheehEXHGiapdUo",
  authDomain: "stoic-af.firebaseapp.com",
  messagingSenderId: "86800269179",
};

let app: App;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
  // Client-side initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore offline persistence failed: failed-precondition. Multiple tabs open?');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore offline persistence failed: unimplemented. Browser not supported.');
      }
    });
} else {
  // Server-side initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
