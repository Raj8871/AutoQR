
import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { getAnalytics, logEvent as fbLogEvent, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp: FirebaseApp;
let analytics: Analytics;

function createFirebaseApp(): FirebaseApp {
  try {
    if (getApps().length) {
      return getApp();
    } else {
      return initializeApp(firebaseConfig);
    }
  } catch (e: any) {
    console.error('Error initializing Firebase:', e);
    throw e; // Re-throw the error to prevent the app from running with Firebase disabled
  }
}

// Initialize Firebase (only once)
try {
  firebaseApp = createFirebaseApp();
  analytics = getAnalytics(firebaseApp);
  console.log('Firebase analytics initialized');
} catch (e: any) {
  console.warn('Firebase initialization failed. Analytics will be disabled.', e);
}

// Log Firebase event
export const logFirebaseEvent = async (eventName: string, params?: { [key: string]: any }) => {
  try {
    if (analytics) {
      await fbLogEvent(analytics, eventName, params);
      console.log(`Firebase event logged: ${eventName}`, params);
    } else {
      console.warn(`Firebase Analytics is not available. Event "${eventName}" will not be logged.`);
    }
  } catch (e: any) {
    console.error(`Error logging Firebase event "${eventName}":`, e);
  }
};
