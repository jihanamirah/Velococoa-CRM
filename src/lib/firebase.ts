import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6383727924-36554"}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6383727924-36554",
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6383727924-36554"}.appspot.com`,
  messagingSenderId: "123456789",
  appId: "1:123456789:web:123456789"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
