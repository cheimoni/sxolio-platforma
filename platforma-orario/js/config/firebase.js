/* ========================================
   FIREBASE - Configuration
   ======================================== */

// Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Export services
const auth = firebase.auth();
const storage = firebase.storage();

// Initialize Firestore
// Note: enablePersistence() is deprecated in newer Firebase versions.
// For full offline persistence with the new API, migrate to modular SDK:
// import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
// const db = initializeFirestore(app, { localCache: persistentLocalCache() });
// For now, using default settings which provide basic caching
const db = firebase.firestore();

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
