import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQQm4pDz16cdEiF0NPBSjMHEtCLWkEQH0",
  authDomain: "hair-salon-schedule.firebaseapp.com",
  projectId: "hair-salon-schedule",
  storageBucket: "hair-salon-schedule.firebasestorage.app",
  messagingSenderId: "426076906388",
  appId: "1:426076906388:web:a9c9d077ac9131bded2581",
  measurementId: "G-30Z0E0XZS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);