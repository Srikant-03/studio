import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvaQSXz7p0MU4HrT5HQ4ctnDbkFt7o1rU",
  authDomain: "hearthlink-1751015867519.firebaseapp.com",
  projectId: "hearthlink-1751015867519",
  storageBucket: "hearthlink-1751015867519.appspot.com",
  messagingSenderId: "389590299572",
  appId: "1:389590299572:web:dd61c944f332c8e317c493"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
