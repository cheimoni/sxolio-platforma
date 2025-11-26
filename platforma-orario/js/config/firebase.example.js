/* ========================================
   FIREBASE - Configuration Template
   ======================================== */

// Copy this file to firebase.js and fill in your Firebase credentials
// NEVER commit firebase.js to git!

// Firebase configuration
const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project.firebaseapp.com",
  databaseURL: "https://your_project.firebasedatabase.app",
  projectId: "your_project_id",
  storageBucket: "your_project.firebasestorage.app",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export services
const auth = firebase.auth();
const storage = firebase.storage();

// Initialize Firestore
const db = firebase.firestore();

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
