import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
   apiKey: "AIzaSyA_GdLy-dKQe_THGhXooxcZPWDsht0LM7U",
  authDomain: "capstone-otp-76768.firebaseapp.com",
  projectId: "capstone-otp-76768",
  storageBucket: "capstone-otp-76768.firebasestorage.app",
  messagingSenderId: "888924365449",
  appId: "1:888924365449:web:4970b6a69dcf8588b81c58",
  measurementId: "G-92QGF8X3EP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber };


