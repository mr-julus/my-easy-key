import pkg from 'discord.js';
const { Client, GatewayIntentBits, REST, Routes } = pkg;
import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'fs';

// Configuration Firebase
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
const storage = getStorage(app);

async function getUserDocumentByUsername(username) {
    const usersCollection = collection(db, 'my-easy-key'); // Remplacez 'users' par le nom de votre collection
    const q = query(usersCollection, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data(); // Renvoie les données du premier document trouvé
    } else {
        return null; // Si aucun document n'est trouvé
    }
}

const token = process.env.DISCORD_BOT_TOKEN

// Créez une nouvelle instance de client Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    checkTime();

    const rest = new REST({ version: '10' }).setToken(token);
    const commands = [
        {
            name: 'my_account_info',
            description: 'Afficher les informations de mon compte',
        },
        {
            name: 'create_account',
            description: 'Créer un compte',
        },
        {
            name: "get_tool",
            description: "Télécharger le programme pour gérer vos clés"
        }
    ];

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
        console.log("The bot is online");
    } catch (error) {
        console.error(error);
    }
});

async function addFieldToDocument(collectionName, documentId, fieldName, fieldValue) {
    const docRef = doc(db, collectionName, documentId);
    try {
      await updateDoc(docRef, {
        [fieldName]: fieldValue
      });
      console.log(`Champ "${fieldName}" ajouté avec la valeur "${fieldValue}" au document "${documentId}".`);
      // await addKeyToKey(fieldName)
    } catch (error) {
      console.error("Erreur lors de l'ajout du champ :", error);
    }
}

async function addKeyToKey(numberWithK) {
    const docRef = doc(db, 'my-easy-key', "settings");
  
    try {
        await updateDoc(docRef, {
            key: arrayUnion(numberWithK)
        });
        console.log(`La clé ${numberWithK} a été ajoutée à used_key.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la clé : ", error);
    }
}

async function createAccount(username) {
    const randomNumberK = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('') + 'K';

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const result = Array.from({ length: 10 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');

    const randomNumber = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');

    const newDocument = {
        username: username,
        activate: false,
        key: randomNumberK,
        used_key: [randomNumberK],
        web_id: result,
        web_number: randomNumber,
        url: 'undefined'
    };

    try {
        const docRef = await addDoc(collection(db, 'my-easy-key'), newDocument);
        await updateDoc(docRef, { token: docRef.id });
        const token = docRef.id
        await addFieldToDocument('my-easy-key', 'settings', token, '17H30');
        console.log('Document created with ID and token: ', token);
        await setupStorage(token)
        return { ...newDocument, token: docRef.id };
    } catch (e) {
        console.error('Erreur lors de l\'ajout du document: ', e);
        return null;
    }
}

async function getData() {
    const docRef = doc(db, 'my-easy-key', "settings");
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data;
    } else {
      throw new Error('Document does not exist');
    }
}

function changeSpecificKey(keys) {
    console.log("Les clés : " + keys.join(', ') + " ont bien été changées.");
}

async function checkTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
  
    try {
      const data = await getData();
  
      console.log('Tous les champs:', data);
  
      let matchFound = false;
      let matchingKeys = [];
  
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const [targetHours, targetMinutes] = value.split('H').map(Number);
          if (hours === targetHours && minutes === targetMinutes) {
            matchFound = true;
            matchingKeys.push(key);
          }
        }
      }
  
      if (matchFound) {
        const channelId = process.env.DISCORD_CHANNEL_ID; // Remplacez par l'ID de votre canal cible
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            const message = matchingKeys.map(key => `La key ${key} a été la même heure que maintenant`).join('\n');
            channel.send(message);
            changeSpecificKey(matchingKeys);
        }
      }
    } catch (error) {
      console.error('Error checking time:', error);
    }
  
    // Schedule the next check
    setTimeout(checkTime, 60000); // Vérifier chaque minute
}

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
async function createFolderAndUploadFile(content, webID, webNB) {
    const fileName = 'fichier.txt';
    const storageRef = ref(storage, `${webID}/${webNB}/${fileName}`); // Chemin avec dossier

    try {
        // Convert content to a Uint8Array for upload
        const byteArray = new TextEncoder().encode(content);
        await uploadBytes(storageRef, byteArray);
        console.log('Dossier créé (implicitement) et fichier uploadé avec succès !');
    } catch (error) {
        console.error('Erreur lors de l\'upload du fichier :', error);
    }
}

async function setupStorage(accessCode) {
    const { webId, webNumber } = await getWebInfo(accessCode);
    await createFolderAndUploadFile('MyEasyKey', webId, webNumber);
}

async function changeAllKeys() {
    const documentIds = await getDocumentIds('my-easy-key');
    for (const id of documentIds) {
        await handle(id);
    }
}

async function getDocumentIds(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documentIds = querySnapshot.docs.map(doc => doc.id);
        return documentIds;
    } catch (error) {
        console.error('Error getting documents: ', error);
        return [];
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

async function handle(accessCode) {
    const numberWithK = generateRandomNumberWithK();
    const usedKey = await getUsedKey(accessCode);
    const isInList = usedKey.includes(numberWithK);

    if (isInList) {
        console.log(`La clé ${numberWithK} a déjà été utilisée, en génère une nouvelle.`);
        await handle(accessCode);
    } else {
        await updateKey(accessCode, numberWithK);
        await addKeyToUsedKeys(accessCode, numberWithK);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction;

    if (commandName === 'my_account_info') {
        const username = user.username; // Récupérer le nom d'utilisateur de la personne qui a fait la commande
        const userDoc = await getUserDocumentByUsername(username);

        if (userDoc) {
            await interaction.reply({ content: `Le bot vous a envoyé en privé les informations, ${username}`, ephemeral: true });
            try {
                const userInfo = JSON.stringify(userDoc, null, 2);
                await user.send(`Les informations de votre compte :\n\`\`\`json\n${userInfo}\n\`\`\``);
            } catch (error) {
                console.error('Could not send DM to the user:', error);
            }
        } else {
            await interaction.reply({ content: `Vous n'avez pas encore de compte MyEasyKey... Si vous souhaitez en créer un, entrez la commande "/create_account"`, ephemeral: true });
        }
    } else if (commandName === 'create_account') {
        const username = user.username; // Récupérer le nom d'utilisateur de la personne qui a fait la commande
        const userDoc = await getUserDocumentByUsername(username);

        if (userDoc) {
            await interaction.reply({ content: `Vous avez déjà un compte... Utilisez la commande : \n /my_account_info`, ephemeral: true });
        } else {
            const newAccount = await createAccount(username);
            if (newAccount) {
                await interaction.reply({ content: `Votre compte a été créé avec succès! Vous avez reçu un message du bot avec vos informations en privé`, ephemeral: true });
                try {
                    const userInfo = JSON.stringify(newAccount, null, 2);
                    await user.send(`Les informations de votre compte :\n\`\`\`json\n${userInfo}\n\`\`\``);
                } catch (error) {
                    console.error('Could not send DM to the user:', error);
                }
            } else {
                await interaction.reply({ content: `Une erreur est survenue lors de la création de votre compte.`, ephemeral: true });
            }
        }
    } else if (commandName === "get_tool") {
        const version = process.env.MYEASYKEY_VERSION;
        try {
            const storageRef = ref(storage, 'tool/' + version + '/');
            const files = await listAll(storageRef);
    
            const fileUrls = await Promise.all(files.items.map(async item => {
                const downloadURL = await getDownloadURL(item);
                return downloadURL;
            }));
    
            const user = interaction.user; // Utilisation de interaction.user pour obtenir l'utilisateur
            await user.send('Hey, voici les liens pour télécharger le tool et l\'api (optional) :')
            await user.send(fileUrls.join('\n'))
            await interaction.reply({ content: 'Les liens ont été envoyés en privé.', ephemeral: true });
            await user.send("N\'oublies pas que tu as besoin de node.js d\'installé sur ton ordinateur pour utiliser le tool et l\'api!")
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers :', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la récupération des fichiers.', ephemeral: true });
        }
    }
});

client.login(token);