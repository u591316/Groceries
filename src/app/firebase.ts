import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2ggIs-KIIpINm5gqmx7PfVLF6OgA4uao",
  authDomain: "groceries-90029.firebaseapp.com",
  projectId: "groceries-90029",
  storageBucket: "groceries-90029.firebasestorage.app",
  messagingSenderId: "236361122719",
  appId: "1:236361122719:web:6518bed692f801ae99f3aa",
  measurementId: "G-YVS4PL0Z42",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Failed to enable Firebase auth persistence", error);
  });
}

export { app, auth, db };
