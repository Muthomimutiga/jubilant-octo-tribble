// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration.
// This should ideally be stored in environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyDCNSsORyIWC4Z-l6EhgrfN-JX1eIgk89U",
  authDomain: "kiguatha-and-co.firebaseapp.com",
  projectId: "kiguatha-and-co",
  storageBucket: "kiguatha-and-co.firebasestorage.app",
  messagingSenderId: "962118803293",
  appId: "1:962118803293:web:1675b72a009ce8628192b4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
