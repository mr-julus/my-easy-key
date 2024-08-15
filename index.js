import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'fs';
import path from 'path';
import { url } from 'node:inspector';
import { access } from 'node:fs';

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

// Fonction pour créer un fichier index.html avec une clé
async function createHTMLFile(filePath, accessCode) {
  const key = await getKey(accessCode)
  const htmlContent = `${key}`;

  // Écriture du fichier index.html
  fs.writeFile(filePath, htmlContent, async (err) => {
    if (err) {
      console.error('Erreur lors de la création du fichier HTML:', err);
      return;
    }
    console.log('Fichier index.html créé avec succès.');
    await uploadFile(filePath, accessCode);
  });
}

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

// Fonction pour vérifier et supprimer le fichier existant, puis uploader le nouveau fichier
async function uploadFile(filePath, accessCode) {
  const { webId, webNumber } = await getWebInfo(accessCode);
  const fileName = path.basename(filePath);
  const storageRef = ref(storage, `${webId}/${webNumber}/${fileName}`);
  const metadata = {
    contentType: 'text/html', // Type de contenu pour HTML
  };

  try {
    // Vérifier si le fichier existe
    const fileExists = await checkFileExists(storageRef);
    if (fileExists) {
      // Supprimer le fichier existant
      await deleteObject(storageRef);
      console.log('Fichier existant supprimé avec succès.');
    }

    // Lire et uploader le nouveau fichier
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Erreur lors de la lecture du fichier:', err);
        return;
      }

      uploadBytes(storageRef, data, metadata)
        .then(async (snapshot) => {
          console.log('Fichier uploadé avec succès!', snapshot);

          // Récupérer l'URL du fichier uploadé
          const url = await getDownloadURL(storageRef);
          console.log('URL du fichier:', url);
          console.log(accessCode)

          // Enregistrer l'URL dans Firestore
          console.log(`Type of accessCode: ${typeof accessCode}, value: ${accessCode}`);
          await updateFileURLInFirestore(accessCode, url);
        })
        .catch((error) => {
          console.error('Erreur lors de l\'upload du fichier:', error);
        });
    });
  } catch (error) {
    console.error('Erreur lors de la vérification ou de la suppression du fichier:', error);
  }
}

// Fonction pour vérifier si un fichier existe dans le stockage
async function checkFileExists(storageRef) {
  try {
    await getDownloadURL(storageRef);
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    throw error;
  }
}

// Fonction pour mettre à jour l'URL dans Firestore
async function updateFileURLInFirestore(accessCode, fileURL) {
  if (typeof accessCode !== 'string') {
    throw new Error('accessCode must be a string');
  }
  
  const docRef = doc(db, 'my-easy-key', accessCode);
  
  try {
    await updateDoc(docRef, { url: fileURL });
    console.log('URL enregistrée dans Firestore avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'URL dans Firestore:', error);
  }
}

// Fonction pour vérifier si la clé existe dans Firestore
async function checkAccessCode(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// Fonction pour récupérer la valeur du champ 'activate'
async function getActivateValue(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.activate;
  } else {
    throw new Error('Document does not exist');
  }
}

async function getKey(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.key;
  } else {
    throw new Error('Document does not exist');
  }
}

async function getData(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log("- Username: " + data.username)
    console.log("- Activate: " + data.activate)
    console.log("- Token: " + data.token)
    console.log("- Key: " + data.key)
    console.log("- Used key: " + data.used_key)
    console.log("- Web id: " + data.web_id)
    console.log("- Web number: " + data.web_number)
    console.log("- Url: " + data.url)
  } else {
    throw new Error('Document does not exist');
  }
}

// Fonction pour récupérer la valeur du champ 'used_key'
async function getUsedKey(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.used_key || []; // Retourne un tableau vide si 'used_key' n'existe pas
  } else {
    throw new Error('Document does not exist');
  }
}

// Fonction pour mettre à jour la valeur du champ 'activate'
async function updateActivateValue(accessCode) {
  const docRef = doc(db, 'my-easy-key', accessCode);

  try {
    await updateDoc(docRef, { activate: true });
    console.log(`Votre clé ${accessCode} a été mise à jour`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la valeur du champ 'activate' : ", error);
  }
}

// Fonction pour vérifier le code
async function check() {
  const rl = readline.createInterface({ input, output });
  const accessCode = await rl.question('Veuillez entrer le code d\'accès : ');
  rl.close();

  try {
    const exists = await checkAccessCode(accessCode);
    if (exists) {
      console.log(`Le code d'accès ${accessCode} est valide`);
      await activate(accessCode);
    } else {
      console.log(`Le code d'accès ${accessCode} n'est pas valide`);
      check(); // Renvoie à la fonction pour réessayer
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la clé d'accès : ", error);
  }
}

// Fonction pour vérifier si le code a déjà été vérifié
async function activate(accessCode) {
  const is_activate = await getActivateValue(accessCode);
  if (is_activate) {
    main(accessCode);
  } else {
    await updateActivateValue(accessCode);
    main(accessCode);
  }
}

// Fonction pour vérifier si le code a déjà été vérifié
async function updloadWebPage(accessCode) {
    const docRef = doc(db, 'my-easy-key', accessCode);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const data = docSnap.data();
      const key = data.key
    } else {
      throw new Error('Document does not exist');
    }
  }

// Fonction menu
async function main(accessCode) {
  console.clear();
  console.log("My Easy Key");
  console.log("1 - Informations sur le token actuelle");
  console.log("2 - Changer la clé");
  console.log("3 - Définir l'heure du changement automatique de votre clé")
  console.log("4 - Utiliser linkvertise")

  const rl = readline.createInterface({ input, output });
  const choose = await rl.question('Que voulez-vous faire? ');
  rl.close();

  if (choose === '1') {
    await keyInformations(accessCode);
  } else if (choose === '2') {
    await handleChangeKey(accessCode);
  } else if (choose === '3') {
    await handleAutomaticUpdate(accessCode)
  } else if (choose === '4') {
    await handleLinkvertise(accessCode)
  } else {
    console.log("Veuillez choisir 1 ou 2");
  }
}

// Fonction pour afficher les informations sur le token
async function keyInformations(accessCode) {
  console.clear();
  console.log("My Easy Key");
  console.log("Voici les informations sur le token actuelle \n");

  await getData(accessCode);

  const rl = readline.createInterface({ input, output });
  const choose = await rl.question('Pour retourner en arrière, entrez "back": ');
  rl.close();

  if (choose === "back") {
    main(accessCode);
  } else {
    console.log("Vérifiez bien l'orthographe!");
    await keyInformations(accessCode);
  }
}

// Fonction pour mettre à jour la clé
async function updateKey(accessCode, value) {
  const docRef = doc(db, 'my-easy-key', accessCode);

  try {
    await updateDoc(docRef, { key: value });
    console.log(`Votre clé ${accessCode} a été mise à jour`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la clé : ", error);
  }
}

// Fonction pour ajouter le numberWithK dans la liste used_key
async function addKeyToUsedKeys(accessCode, numberWithK) {
  const docRef = doc(db, 'my-easy-key', accessCode);

  try {
    await updateDoc(docRef, {
      used_key: arrayUnion(numberWithK)
    });
    console.log(`La clé ${numberWithK} a été ajoutée à used_key.`);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la clé : ", error);
  }
}

// Fonction pour générer un nombre aléatoire avec 'K'
function generateRandomNumberWithK() {
  let randomNumber = '';
  for (let i = 0; i < 10; i++) {
    const randomDigit = Math.floor(Math.random() * 10);
    randomNumber += randomDigit;
  }
  randomNumber += 'K';
  return randomNumber;
}

// Fonction pour changer la clé
async function handleChangeKey(accessCode) {
  const numberWithK = generateRandomNumberWithK();
  const usedKey = await getUsedKey(accessCode);
  const isInList = usedKey.includes(numberWithK);

  if (isInList) {
    console.log(`La clé ${numberWithK} a déjà été utilisée, en génère une nouvelle.`);
    await handleChangeKey(accessCode);
  } else {
    await updateKey(accessCode, numberWithK);
    await addKeyToUsedKeys(accessCode, numberWithK);
    await createHTMLFile("index.html", accessCode);

    const rl = readline.createInterface({ input, output });
    const choose = await rl.question('Pour retourner en arrière, entrez "back": ');
    rl.close();
  
    if (choose === "back") {
      main(accessCode);
    } else {
      console.log("Vérifiez bien l'orthographe!");
      await keyInformations(accessCode);
    }
  }
}

async function getTokenFromURL(url) {
  const q = query(collection(db, 'my-easy-key'), where('url', '==', url));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return userDoc.data().token;
  } else {
    throw new Error('User not found');
  }
}

async function initLinkInFirestore(link) {
  const token = await getTokenFromURL(link)
  const docRef = doc(db, "my-easy-key", token);
  try {
    await updateDoc(docRef, {
      linkvertiseUrl: link
    });
    this.log('Enregistrement du lien linkvertise terminé');
  } catch (error) {
    console.error(error);
  }
}

async function useLinkvertise(linkvertiseToken, url) {
  try {
    const data = {
      title: 'MEK - Get your key',
      destination: url
    };
    const headers = {
      'Authorization': `Bearer ${linkvertiseToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post('https://api.linkvertise.com/api/v1/link', data, { headers });

    if (response.status === 201) {
      const linkData = response.data;
      const linkvertiseUrl = linkData.link;
      await initLinkInFirestore(linkvertiseUrl)
      console.log(`Votre lien monétisé est : ${linkvertiseUrl}`);
      return linkvertiseUrl
    } else {
      console.error('Erreur lors de la création du lien:', response.data);
    }
  } catch (error) {
    if (error.response) {
      console.error('Erreur de réponse du serveur:', error.response.data);
    } else if (error.request) {
      console.error('Erreur de requête:', error.request);
    } else {
      console.error('Erreur lors de la configuration de la requête:', error.message);
    }
  }
}

async function handleLinkvertise(accessCode) {
  const rl = readline.createInterface({ input, output });
  const url = await rl.question('Entrez le lien : ');
  rl.close();

  if (url === "back") {
    main(accessCode);
  } else {
    const rl = readline.createInterface({ input, output });
    const token = await rl.question('Entrez votre token linkvertise : ');
    rl.close();

    await useLinkvertise(token, url)
    await main(accessCode)
  }
}

async function getFieldValue(collectionName, documentId, fieldName) {
  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
      const data = docSnap.data();
      return data[fieldName]; // Retourne la valeur du champ spécifié
  } else {
      console.log('Aucun document trouvé!');
      return null;
  }
}

function isValidTimeFormat(value) {
  const regex = /^(?:[01]\d|2[0-3])H[0-5]\d$/; // Format HHHMM
  return regex.test(value);
}

async function updateSettings(accessCode, newValue) {
  if (!isValidTimeFormat(newValue)) {
    console.error('Le format de la valeur n\'est pas valide. Utilisez le format HHHMM (ex: 17H28).');
    return; // Sortir si le format est invalide
  }

  const docRef = doc(db, 'my-easy-key', "settings");
  
  try {
    const updateData = {};
    updateData[accessCode] = newValue;

    await updateDoc(docRef, updateData);
    console.log(`Paramètres mis à jour pour le code d'accès: ${accessCode}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres dans Firestore:', error);
  }
}

async function handleAutomaticUpdate(accessCode) {
  const oclock = await getFieldValue('my-easy-key', 'settings', accessCode)
  console.clear();
  console.log("My Easy Key");
  console.log("Votre clé est automatiquement changé à : " + oclock);

  const rl = readline.createInterface({ input, output });
  const choose = await rl.question('Si vous voulez changer d\'heure, entrez "change". Pour retourner en arrière, entrez "back": ');
  rl.close();

  if (choose === "back") {
    main(accessCode);
  } else if (choose === "change") {
    const rl = readline.createInterface({ input, output });
    const choose = await rl.question('Entrez l\'heure dans ce format 00H00: ');
    rl.close();

    await updateSettings(accessCode, choose)
    handleAutomaticUpdate(accessCode)
  } else {
    console.log("Vérifiez bien l'orthographe!");
    await handleAutomaticUpdate(accessCode);
  }
}

// Démarrer le programme
check();