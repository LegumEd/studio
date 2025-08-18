// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "lex-legum-academy-student-hub",
  "appId": "1:474333923300:web:19c63e31518188b49ba9f1",
  "storageBucket": "lex-legum-academy-student-hub.firebasestorage.app",
  "apiKey": "AIzaSyB1kxVMoHYGqxnS4XmJn7HK8q-tXn3xbxE",
  "authDomain": "lex-legum-academy-student-hub.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "474333923300"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
