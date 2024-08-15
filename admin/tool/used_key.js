import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Configuration de votre projet Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getData(accessCode) {
    const docRef = doc(db, 'my-easy-key', accessCode);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const data = docSnap.data();
      const key = data.key
      return key
    } else {
      throw new Error('Document does not exist');
    }
  }

async function addFieldToDocument(documentId, fieldValue) {
    const docRef = doc(db, "my-easy-key", documentId);
    try {
      await updateDoc(docRef, {
        used_key: [fieldValue]
      });
      console.log("Used_key has been reset successfully")
    } catch (error) {
      console.error("Erreur lors de l'ajout du champ :", error);
    }
}

async function main() {
    const rl = readline.createInterface({ input, output });
    const token = await rl.question('Token: ')
  
    try {
        const key = await getData(token)
        await addFieldToDocument(token, key)
    } catch (error) {
      console.error(error);
    } finally {
      rl.close();
    }
}

main()