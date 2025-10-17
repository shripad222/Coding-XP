// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDags2xPwuDcETjQ6DZLRtgOvhRUaRVe0g",
  authDomain: "sehatsathi-cb7d9.firebaseapp.com",
  databaseURL: "https://sehatsathi-cb7d9-default-rtdb.firebaseio.com",
  projectId: "sehatsathi-cb7d9",
  storageBucket: "sehatsathi-cb7d9.firebasestorage.app",
  messagingSenderId: "305259371381",
  appId: "1:305259371381:web:4ac854512701005b82513c"
};

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
