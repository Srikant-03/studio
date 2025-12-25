import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5ZhQBTS9XoPsS0351dyHBeKm2jkJ48QM",
  authDomain: "gen-lang-client-0460363684.firebaseapp.com",
  projectId: "gen-lang-client-0460363684",
  storageBucket: "gen-lang-client-0460363684.appspot.com",
  messagingSenderId: "771206836116",
  appId: "1:771206836116:web:2cba428559e3a098dea981",
  measurementId: "G-HZYD9CRL82"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
