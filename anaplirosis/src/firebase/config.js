// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnKzEkMrWcCkpJhgVeDSw_cJGUgHBep5M",
  authDomain: "platformalas.firebaseapp.com",
  databaseURL: "https://platformalas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "platformalas",
  storageBucket: "platformalas.firebasestorage.app",
  messagingSenderId: "486304725952",
  appId: "1:486304725952:web:eacfc49431f408122ae625",
  measurementId: "G-81Y4KNS1YN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, analytics, database, auth };

