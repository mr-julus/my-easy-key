import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
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

// Fonction pour créer un document Firestore
async function createDocument(username) {
    const key = generateRandomNumberWithK();
    const webId = generateRandomString(12);
    const webNB = generateWebNumber();

    const newDocument = {
        username: username,
        activate: false,
        key: key,
        used_key: [key],
        web_id: webId,
        web_number: webNB,
        url: 'undefined'
    };

    try {
      const docRef = await addDoc(collection(db, 'my-easy-key'), newDocument);
      const docID = docRef.id
      console.log('Token: ', docRef.id);
      return docID
    } catch (e) {
      console.error('Erreur lors de l\'ajout du document: ', e);
    }
}

function generateRandomNumberWithK() {
    let randomNumber = '';
    for (let i = 0; i < 10; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      randomNumber += randomDigit;
    }
    randomNumber += 'K';
    return randomNumber;
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
}

function generateWebNumber() {
    let randomNumber = '';
    for (let i = 0; i < 5; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      randomNumber += randomDigit;
    }
    randomNumber += 'K';
    return randomNumber;
}

// Fonction pour ajouter un champ à un document
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

// Fonction pour récupérer les informations web_id et web_number
async function getWebInfo(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const webId = data.web_id;
    const webNumber = data.web_number;
    return { webId, webNumber };
  } else {
    throw new Error('Document does not exist');
  }
}

// Fonction pour créer un dossier et uploader un fichier
async function createFolderAndUploadFile(filePath, webID, webNB) {
  const fileName = filePath.split('/').pop();
  const storageRef = ref(storage, `${webID}/${webNB}/${fileName}`);

  const data = fs.readFileSync(filePath);

  try {
    await uploadBytes(storageRef, data);
    console.log('Dossier créé (implicitement) et fichier uploadé avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier :', error);
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const username = await rl.question('Username: ');

  try {
    const accessCode = await createDocument(username);
    const { webId, webNumber } = await getWebInfo(accessCode);
    await createFolderAndUploadFile('admin/init/fichier.txt', webId, webNumber);
    await addFieldToDocument('my-easy-key', 'settings', accessCode, '17H30');
  } catch (error) {
    console.error(error);
  } finally {
    rl.close();
  }
}

main();