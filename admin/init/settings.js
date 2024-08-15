import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Configuration Firebase (remplacez par vos propres valeurs)
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

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction pour ajouter un champ et sa valeur à un document
async function addFieldToDocument(collectionName, documentId, fieldName, fieldValue) {
  const docRef = doc(db, collectionName, documentId);
  try {
    await updateDoc(docRef, {
      [fieldName]: fieldValue
    });
    console.log(`Champ "${fieldName}" ajouté avec la valeur "${fieldValue}" au document "${documentId}".`);
  } catch (error) {
    console.error("Erreur lors de l'ajout du champ :", error);
  }
}

// Exemple d'utilisation
addFieldToDocument('my-easy-key', 'settings', 'TOKEN', '17H30');
