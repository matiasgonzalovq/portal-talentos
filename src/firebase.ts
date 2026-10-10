import { initializeApp, } from "firebase/app";
import { getAuth, } from "firebase/auth";
import { getFirestore, } from "firebase/firestore";

// Read Firebase config from environment variables.
// Vite injects variables with VITE_ prefix into client code process.env.
// For server-side or test environments, provide fallback values that
// indicate configuration is needed, or use Firebase Emulator Suite for local development.
const apiKey = process.env.VITE_FIREBASE_API_KEY;
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.VITE_FIREBASE_APP_ID;

// Validate that required config is present; if not, throw a helpful error
// message directing the developer to set environment variables or use
// Firebase Emulator Suite for local development.
if (
  !apiKey ||
  !authDomain ||
  !projectId ||
  !appId
) {
  throw new Error(
    "Firebase configuration is incomplete. " +
    "Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID environment variables, " +
    "or use Firebase Emulator Suite for local development without real credentials."
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
}

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export all needed modules for the app.
// firebaseConfig: Vite-injected config for client use.
// auth: Firebase auth instance.
// db: Firestore database instance.
export { firebaseConfig, auth, db };