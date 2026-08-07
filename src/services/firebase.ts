import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9MXfU9ESRd_MxHmZIJSZcqGFvpT5I9z8",
  authDomain: "fintrack-7136f.firebaseapp.com",
  projectId: "fintrack-7136f",
  storageBucket: "fintrack-7136f.firebasestorage.app",
  messagingSenderId: "407552831823",
  appId: "1:407552831823:web:19dda901bf1bf3a2d2953a",
  measurementId: "G-4XXJ2XC3MV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
