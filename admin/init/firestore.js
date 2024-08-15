import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

async function createDocument(data) {
  try {
    const docRef = await addDoc(collection(db, 'my-easy-key'), data);
    console.log('Token: ', docRef.id);
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
const key = generateRandomNumberWithK()

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
}
const webId = generateRandomString(12);
  

function generateWebNumber() {
    let randomNumber = '';
    for (let i = 0; i < 5; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      randomNumber += randomDigit;
    }
    randomNumber += 'K';
    return randomNumber;
}
const webNB = generateWebNumber()

// Exemple d'utilisation
const newDocument = {
  username: 'exampleUser',
  activate: false,
  key: key,
  used_key: [key],
  web_id: webId,
  web_number: webNB,
  url: 'undefined'
};

createDocument(newDocument);