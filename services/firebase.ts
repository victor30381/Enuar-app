import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyAcURfintKpwtmcLDTVWKbP2VU_LLnDeFk",
    authDomain: "enuar-app.firebaseapp.com",
    projectId: "enuar-app",
    storageBucket: "enuar-app.firebasestorage.app",
    messagingSenderId: "490292444780",
    appId: "1:490292444780:web:88b3858cc39687c002a249",
    measurementId: "G-1F8G3TC3JM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1'); // O la región que uses

export default app;
