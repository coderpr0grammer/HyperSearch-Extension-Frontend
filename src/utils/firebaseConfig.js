// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWRh1dorXANIxmMIHoUTcOAjcDmj5dOR8",
  authDomain: "skm-extension-official.firebaseapp.com",
  projectId: "skm-extension-official",
  storageBucket: "skm-extension-official.appspot.com",
  messagingSenderId: "173016892459",
  appId: "1:173016892459:web:a7bfb3456c526c2a8a966e",
  measurementId: "G-6VJSX11TV9"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app)
const analytics = getAnalytics(app);
