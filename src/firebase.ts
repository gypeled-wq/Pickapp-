import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRpaEvBjBiSGBSBJD5vVt8r4L-6dwAdZY",
  authDomain: "ferrous-welder-s6m9v.firebaseapp.com",
  projectId: "ferrous-welder-s6m9v",
  storageBucket: "ferrous-welder-s6m9v.firebasestorage.app",
  messagingSenderId: "651707544997",
  appId: "1:651707544997:web:6fd5a33b6b89d94c30e44c"
};

const app = initializeApp(firebaseConfig);

// use the custom firestore databaseId from the applet configuration
export const db = getFirestore(app, "ai-studio-d4859a5f-0244-4003-9184-ca91b374587f");
