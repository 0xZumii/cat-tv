import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBIe-l_1pSlxb0HZGK8Q4-CRG8gyO7uJ4I",
  authDomain: "cattv-99bd2.firebaseapp.com",
  projectId: "cattv-99bd2",
  storageBucket: "cattv-99bd2.firebasestorage.app",
  messagingSenderId: "411688090914",
  appId: "1:411688090914:web:3461c494f438bd3ad7797b",
  measurementId: "G-TWYQN2W46P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Uncomment to use local emulators (run: firebase emulators:start)
// if (window.location.hostname === 'localhost') {
//   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// Auth helpers
export const signInAnon = () => signInAnonymously(auth);

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Cloud function callers
export const callClaimDaily = httpsCallable(functions, 'claimDaily');
export const callFeed = httpsCallable(functions, 'feed');
export const callAddCat = httpsCallable(functions, 'addCat');
export const callGetCats = httpsCallable(functions, 'getCats');
export const callGetStats = httpsCallable(functions, 'getStats');
export const callGetUser = httpsCallable(functions, 'getUser');
export const callCreateCheckout = httpsCallable(functions, 'createCheckoutSession');
export const callGetPurchaseTiers = httpsCallable(functions, 'getPurchaseTiers');
