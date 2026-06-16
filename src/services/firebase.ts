import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkCriqD6L6J3LEHy6XhUs1Z7MpU07QskM",
  authDomain: "farmer-marketplaced.firebaseapp.com",
  projectId: "farmer-marketplaced",
  storageBucket: "farmer-marketplaced.firebasestorage.app",
  messagingSenderId: "960009541350",
  appId: "1:960009541350:web:9346cff60153194dfacd27",
  measurementId: "G-E0VF81L0RN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);