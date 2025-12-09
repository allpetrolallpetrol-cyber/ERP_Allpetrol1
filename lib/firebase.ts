
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Helper para leer variables de entorno de forma segura o usar fallback
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key] || fallback;
  } catch {
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyAGY6r4CPE3M8BDKpxW0VVYoj68wm828Tc"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "erpallpetrol.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "erpallpetrol"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "erpallpetrol.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "176469163178"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:176469163178:web:e717d09b0b0797061d24d3")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
