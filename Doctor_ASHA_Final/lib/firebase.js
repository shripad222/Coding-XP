
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDags2xPwuDcETjQ6DZLRtgOvhRUaRVe0g",
  authDomain: "sehatsathi-cb7d9.firebaseapp.com",
  projectId: "sehatsathi-cb7d9",
  storageBucket: "sehatsathi-cb7d9.appspot.com",
  messagingSenderId: "305259371381",
  appId: "1:305259371381:web:09e100f5d044d9f682513c"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);
