'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'yac-fantasy-league',
  appId: '1:495683435548:web:8786d0e791c7d9051c33d9',
  storageBucket: 'yac-fantasy-league.firebasestorage.app',
  apiKey: 'AIzaSyCNNCVA79p4gMT-AZ2s3KpV4_Cb4IImE3A',
  authDomain: 'yac-fantasy-league.firebaseapp.com',
  messagingSenderId: '495683435548',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const db = getFirestore(app);
// const auth = getAuth(app);

// export { app, db, auth };
export { app };
