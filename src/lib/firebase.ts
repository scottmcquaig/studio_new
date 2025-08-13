import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "yac-fantasy-league",
  "appId": "1:495683435548:web:8786d0e791c7d9051c33d9",
  "storageBucket": "yac-fantasy-league.firebasestorage.app",
  "apiKey": "AIzaSyCNNCVA79p4gMT-AZ2s3KpV4_Cb4IImE3A",
  "authDomain": "yac-fantasy-league.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "495683435548"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
