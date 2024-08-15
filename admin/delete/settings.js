import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, deleteField } from 'firebase/firestore';

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

// Fonction pour supprimer un champ d'un document
async function deleteFieldFromDocument(fieldName) {
  const docRef = doc(db, "my-easy-key", "settings");
  try {
    await updateDoc(docRef, {
      [fieldName]: deleteField()
    });
    console.log(`Le champ "${fieldName}" du document "${documentId}" dans la collection "${collectionName}" a été supprimé.`);
  } catch (error) {
    console.error("Erreur lors de la suppression du champ :", error);
  }
}

deleteFieldFromDocument('my-field-name');