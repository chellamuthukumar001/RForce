import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDmaUdoBPOvEfP1kBWpbdVLD_yoopJhukA",
    authDomain: "helprix-937ce.firebaseapp.com",
    projectId: "helprix-937ce",
    storageBucket: "helprix-937ce.firebasestorage.app",
    messagingSenderId: "228827134278",
    appId: "1:228827134278:web:ffa7b236a56f818eba4d47",
    measurementId: "G-64SBPD5T10"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
