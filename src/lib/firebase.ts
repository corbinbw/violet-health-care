import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAe9mUfoNE6lIEfQgdgwqKqRSmj11Bd5e8",
  authDomain: "violet-b15fc.firebaseapp.com",
  projectId: "violet-b15fc",
  storageBucket: "violet-b15fc.appspot.com",
  messagingSenderId: "834811455192",
  appId: "1:834811455192:web:8f7f2b7cecfdc0cea399ad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export { auth };
export const db = getFirestore(app); 