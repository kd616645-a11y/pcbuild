// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_hmfZqB4TJBcrIqfgvMSJyIIrkxSE8Eg",
  authDomain: "test2-9f83d.firebaseapp.com",
  projectId: "test2-9f83d",
  storageBucket: "test2-9f83d.firebasestorage.app",
  messagingSenderId: "64061583386",
  appId: "1:64061583386:web:7b44f5ad80eed8bc4b61a3",
  measurementId: "G-FHTTLR8ZSP"
};

// Firebase Auth hash_config for backend user import / password hashing.
// This is not part of frontend initialization and is only used by
// Firebase Admin SDK / CLI import workflows.
/*
hash_config {
  algorithm: SCRYPT,
  base64_signer_key: zyakL4CiXVRZNKyrMU5D48l6RdOnVjyvlQsKswi0qilkPzrdf3Nqa6Z1666sceEed+WSCseZObhvBfVhbW2gAQ==,
  base64_salt_separator: Bw==,
  rounds: 8,
  mem_cost: 14,
}
*/

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
