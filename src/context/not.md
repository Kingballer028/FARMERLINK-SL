// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);