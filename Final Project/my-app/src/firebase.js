// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjhZydJeuDxANAWA2lIyRHOEpexbgPLwk",
  authDomain: "final-project-6b77f.firebaseapp.com",
  projectId: "final-project-6b77f",
  storageBucket: "final-project-6b77f.firebasestorage.app",
  messagingSenderId: "903542486103",
  appId: "1:903542486103:web:a7c99bd88abd3fd5ed9f12",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional export of app itself
export default app;
