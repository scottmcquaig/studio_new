
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

export { app };
