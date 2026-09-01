import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCTS4SpDKI2XI5F1uiXH_44a1aJb34Cw_0",
  authDomain: "ai-wilt.firebaseapp.com",
  projectId: "ai-wilt",
  storageBucket: "ai-wilt.firebasestorage.app",
  messagingSenderId: "816754568563",
  appId: "1:816754568563:web:337d5e9d4a3718a4fea906",
  measurementId: "G-NP59W3WHFX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
