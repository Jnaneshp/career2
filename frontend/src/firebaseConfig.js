import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXPzdmr8LgZviGRDp_EjtnyugEQKoDyiU",
  authDomain: "carrer-a58db.firebaseapp.com",
  projectId: "carrer-a58db",
  storageBucket: "carrer-a58db.firebasestorage.app",
  messagingSenderId: "69928822487",
  appId: "1:69928822487:web:0e5c1520339c491378b292",
  measurementId: "G-Q3LYPDEZHK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();