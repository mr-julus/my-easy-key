import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'fs';

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
const storage = getStorage(app);

// Fonction pour récupérer les champs 'web_id' et 'web_number'
async function getWebInfo(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const webId = data.web_id; // Récupère le champ 'web_id'
    const webNumber = data.web_number; // Récupère le champ 'web_number'
    return { webId, webNumber }; // Retourne un objet avec les deux valeurs
  } else {
    throw new Error('Document does not exist');
  }
}

// Fonction pour uploader un fichier dans un "dossier"
async function createFolderAndUploadFile(filePath, webID, webNB) {
  const fileName = filePath.split('/').pop();
  const storageRef = ref(storage, `${webID}/${webNB}/${fileName}`); // Chemin avec dossier

  const data = fs.readFileSync(filePath); // Lit le fichier

  try {
    await uploadBytes(storageRef, data);
    console.log('Dossier créé (implicitement) et fichier uploadé avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier :', error);
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const accessCode = await rl.question('Token: ');
  rl.close();

  try {
    const { webId, webNumber } = await getWebInfo(accessCode);
    // Exemple d'utilisation
    await createFolderAndUploadFile('init/fichier.txt', webId, webNumber);
  } catch (error) {
    console.error(error);
  }
}

main();
