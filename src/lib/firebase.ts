
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  "projectId": "yac-fantasy-league",
  "appId": "1:495683435548:web:8786d0e791c7d9051c33d9",
  "storageBucket": "yac-fantasy-league.appspot.com",
  "apiKey": "AIzaSyCNNCVA79p4gMT-AZ2s3KpV4_Cb4IImE3A",
  "authDomain": "yac-fantasy-league.firebaseapp.com",
  "messagingSenderId": "495683435548"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);
const db = getFirestore(app);
// const auth = getAuth(app);

export { app, db, storage };
