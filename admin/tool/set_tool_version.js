import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'fs';
import path from 'path';

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
const storage = getStorage(app);

async function uploadFile(filePath, version) {
    const fileName = path.basename(filePath);
    const storageRef = ref(storage, `/tool/${version}/${fileName}`);
    
    const data = fs.readFileSync(filePath);
    
    try {
        await uploadBytes(storageRef, data);
        console.log(`Fichier ${fileName} uploadé avec succès dans le dossier version ${version}`);
    } catch (error) {
        console.error(`Erreur lors de l'upload du fichier ${fileName} :`, error);
    }
}

async function updateEnvVersion() {
    const rl = readline.createInterface({ input, output });
    const newVersion = await rl.question('Entrez le nouveau numéro de version : ');
    const isTestVersion = await rl.question("Est-ce une version bêta? [Y/N] ");
    rl.close();

    const envFilePath = '.env'; // Corrigé le chemin du fichier
    const envData = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envData.split('\n');

    let newEnvLines;
    if (isTestVersion === "Y") {
        newEnvLines = envLines.map(line => {
            if (line.startsWith('MYEASYKEY_BETA_VERSION=')) {
                return `MYEASYKEY_BETA_VERSION=${newVersion}`;
            }
            return line;
        });
    } else if (isTestVersion === "N") {
        newEnvLines = envLines.map(line => {
            if (line.startsWith('MYEASYKEY_VERSION=')) {
                return `MYEASYKEY_VERSION=${newVersion}`;
            }
            return line;
        });
    }

    fs.writeFileSync(envFilePath, newEnvLines.join('\n'));
    console.log('La version de MYEASYKEY a été mise à jour avec succès.');

    const filesToUpload = ['index.js', 'api.js'];

    try {
        for (const file of filesToUpload) {
            await uploadFile(file, newVersion); // Utilisez newVersion ici
        }
    } catch (error) {
        console.error('Erreur lors de l\'upload des fichiers :', error);
    }
}

updateEnvVersion();