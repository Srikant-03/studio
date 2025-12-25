import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDa4JLqxZylgKuOafRLjzGW-S7JsdjG-V8",
  authDomain: "studio-7194410805-fdb62.firebaseapp.com",
  projectId: "studio-7194410805-fdb62",
  storageBucket: "studio-7194410805-fdb62.appspot.com",
  messagingSenderId: "954567614738",
  appId: "1:954567614738:web:586fcab824d8ff4d58d3cb"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
