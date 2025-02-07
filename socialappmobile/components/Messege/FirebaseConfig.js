import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; 

const firebaseConfig = {
  apiKey: "AIzaSyA1DAHUTeHKMqSVBTAFrvDR4fZOtX8cUik",
  authDomain: "socialapp-9bfd7.firebaseapp.com",
  projectId: "socialapp-9bfd7",
  databaseURL: "https://socialapp-9bfd7-default-rtdb.asia-southeast1.firebasedatabase.app", 
  messagingSenderId: "595661699909",
  appId: "1:595661699909:web:51c3cdd1e86548249b9c2c",
  measurementId: "G-XQCRFYRPGD",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { database, analytics };
