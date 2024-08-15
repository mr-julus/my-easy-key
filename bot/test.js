import pkg from 'discord.js';
const { Client, GatewayIntentBits, REST, Routes } = pkg;
import { config } from 'dotenv';
config();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, arrayUnion, setDoc, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll, deleteObject, uploadBytes } from 'firebase/storage';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'path';
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

async function isUserAuthorized(username) {
    const docRef = doc(db, 'administrators', "adminList");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const authorizedUsers = data.admins
        return authorizedUsers.includes(username);
    } else {
        throw new Error('Document does not exist');
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
            name: 'use_linkvertise',
            description: 'Utiliser linkvertise api',
            options: [
                {
                    name: 'linkvertise_token',
                    type: 3,
                    description: 'Ton token linkvertise',
                    required: true,
                },
            ],
        },
        {
            name: 'automatic_change_settings',
            description: 'Parametre de changement automatique de ma clé',
            options: [
                {
                    name: 'time',
                    type: 3,
                    description: 'l\'heure à la quelle vous voulez que vous clé soit modifié automatiquement, (ex: 09H45)',
                    required: true,
                },
            ],
        },
        {
            name: "change_my_key",
            description: "Changer ma clé maintenant manuellement"
        },
        {
            name: "get_api_example",
            description: "Obtenir un exemple d'utilisation de l'api"
        },
        {
            name: "get_tool",
            description: "(ADMIN ONLY) Télécharger le programme pour gérer vos clés"
        },
        {
            name: 'set_admin',
            description: '(ADMIN ONLY) Mettre quelqu\'un administrateur',
            options: [
                {
                    name: 'username',
                    type: 3,
                    description: 'Le nom d\'utilisateur à ajouter en tant qu\'administrateur',
                    required: true,
                },
            ],
        },
        {
            name: 'remove_admin',
            description: '(ADMIN ONLY) Supprimer à quelqu\'un le rôle d\'administrateur',
            options: [
                {
                    name: 'username',
                    type: 3,
                    description: 'Nom d\'utilisateur de la personne à retirer du rôle d\'administrateur',
                    required: true,
                },
            ],
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

// Fonction pour créer un fichier index.html avec une clé
async function createHTMLFile(filePath, accessCode, key) {
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

async function changeSpecificKey(accessCode) {
    const numberWithK = generateRandomNumberWithK();
    const usedKey = await getUsedKey(accessCode);
    const isInList = usedKey.includes(numberWithK);
  
    if (isInList) {
      console.log(`La clé ${numberWithK} a déjà été utilisée, en génère une nouvelle.`);
      await changeSpecificKey(token);
    } else {
      await updateKey(accessCode, numberWithK);
      await addKeyToUsedKeys(accessCode, numberWithK);
      await createHTMLFile("index.html", accessCode, numberWithK);
    }
}

async function processElements(elements) {
    if (!Array.isArray(elements)) {
        throw new TypeError("elements must be an array");
    }
    for (const element of elements) {
        await changeSpecificKey(element);
    }
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
            processElements(matchingKeys).then(() => {
                console.log('All elements processed.');
            });
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

function isHHMM(timeString) {
    const regex = /^([0-1][0-9]|2[0-3])H[0-5][0-9]$/;
    return regex.test(timeString);
}
 
async function updateSettings(accessCode, newValue) {
    if (!isHHMM(newValue)) {
        console.error('Le format de la valeur n\'est pas valide. Utilisez le format HH:MM (ex: 17:28).');
        console.error(newValue);
        throw new Error('Le format de l\'heure est incorrect.');
    }
  
    const docRef = doc(db, 'my-easy-key', "settings");
    
    try {
        const updateData = {};
        updateData[accessCode] = newValue;
  
        await updateDoc(docRef, updateData);
        console.log(`Paramètres mis à jour pour le code d'accès: ${accessCode}`);
    } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres dans Firestore:', error);
        throw error;
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction;

    if (commandName === 'my_account_info') {
        const username = user.username; // Récupérer le nom d'utilisateur de la personne qui a fait la commande
        const userDoc = await getUserDocumentByUsername(username);

        if (userDoc) {
            await interaction.reply({ content: `Le bot vous a envoyé en privé les informations, ${username}`, ephemeral: true });
            try {
                await user.send(`Voici les informations de votre compte : \nNom d'utilisateur : ${userDoc.username}\nToken : ${userDoc.token}\nClé : ${userDoc.used_key}\nClé déjà utilisées : ${userDoc}\nWeb ID : ${userDoc.web_id}\nWeb Number : ${userDoc.web_number}\nURL : ${userDoc.url}`);
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
        const username = user.username;
        const is_authorised = await isUserAuthorized(username)

        if (!is_authorised) {
            await interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
            return;
        }

        if (!isUserAuthorized(username)) {
            await interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
            return;
        }

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
    } else if (commandName === "get_api_example") {
        const username = user.username;

        try {
            const storageRef = ref(storage, 'tool/api/');
            const files = await listAll(storageRef);
    
            const fileUrls = await Promise.all(files.items.map(async item => {
                const downloadURL = await getDownloadURL(item);
                return downloadURL;
            }));
    
            const user = interaction.user; // Utilisation de interaction.user pour obtenir l'utilisateur
            await user.send('Hey, voici le lien pour télécharger un exemple de l\'utilisation d\'une requête pour recuperer la clé à partir d\'une url :')
            await user.send(fileUrls.join('\n'))
            await interaction.reply({ content: 'Les liens ont été envoyés en privé.', ephemeral: true });
            await user.send("N\'oublies pas que tu as besoin de node.js d\'installé sur ton ordinateur pour utiliser l\'api!")
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers :', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la récupération des fichiers.', ephemeral: true });
        }
    
    } else if (commandName === "use_linkvertise") {
        const username = user.username;
        const userDoc = await getUserDocumentByUsername(username);
        const token = interaction.options.getString('linkvertise_token');
        const url = userDoc.url

        if (!username) {
            await interaction.reply({ content: 'Le token linkvertise ne peut pas être vide.', ephemeral: true });
            return;
        }

        if (userDoc) {
            try {
                const linkvertiseUrl = await useLinkvertise(token, url)
        
                const user = interaction.user; // Utilisation de interaction.user pour obtenir l'utilisateur
                await user.send('Hey, voici ton lien linkvertise : ' + linkvertiseUrl)
                await user.send(fileUrls.join('\n'))
                await interaction.reply({ content: 'Le liens a été envoyé en privé.', ephemeral: true });
            } catch (error) {
                console.error('Erreur lors de la récupération des fichiers :', error);
                await interaction.reply({ content: 'Une erreur est survenue', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: `Vous n'avez pas encore de compte MyEasyKey... Si vous souhaitez en créer un, entrez la commande "/create_account"`, ephemeral: true });
        }
        
    } else if (commandName === 'set_admin') {
        const us = user.username;
        const is_authorised = await isUserAuthorized(us)

        if (!is_authorised) {
            await interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
            return;
        }

        const username = interaction.options.getString('username');

        if (!username) {
            await interaction.reply({ content: 'Le nom d\'utilisateur ne peut pas être vide.', ephemeral: true });
            return;
        }

        try {
            const docRef = doc(db, 'administrators', 'adminList');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const admins = docSnap.data().admins || [];

                if (admins.includes(username)) {
                    await interaction.reply({ content: `L'utilisateur ${username} est déjà dans la liste des administrateurs.`, ephemeral: true });
                    return;
                }

                await updateDoc(docRef, {
                    admins: arrayUnion(username)
                });
            } else {
                await setDoc(docRef, {
                    admins: [username]
                });
            }

            await interaction.reply({ content: `L'utilisateur ${username} a été ajouté à la liste des administrateurs.`, ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de Firestore :', error);
            await interaction.reply({ content: 'Erreur lors de la mise à jour de la liste des administrateurs.', ephemeral: true });
        }
    } else if (commandName === 'remove_admin') {
        const us = user.username;
        const is_authorised = await isUserAuthorized(us)

        if (!is_authorised) {
            await interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
            return;
        }
            const username = interaction.options.getString('username');
        
            if (!username) {
                await interaction.reply({ content: 'Le nom d\'utilisateur ne peut pas être vide.', ephemeral: true });
                return;
            }
        
            try {
                const docRef = doc(db, 'administrators', 'adminList');
                const docSnap = await getDoc(docRef);
        
                if (docSnap.exists()) {
                    const admins = docSnap.data().admins || [];
        
                    if (!admins.includes(username)) {
                        await interaction.reply({ content: `L'utilisateur ${username} n'est pas dans la liste des administrateurs.`, ephemeral: true });
                        return;
                    }
        
                    await updateDoc(docRef, {
                        admins: arrayRemove(username)
                    });
        
                    await interaction.reply({ content: `L'utilisateur ${username} a été supprimé de la liste des administrateurs.`, ephemeral: true });
                } else {
                    await interaction.reply({ content: 'La liste des administrateurs est vide.', ephemeral: true });
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de Firestore :', error);
                await interaction.reply({ content: 'Erreur lors de la mise à jour de la liste des administrateurs.', ephemeral: true });
            }
    } else if (commandName === 'automatic_change_settings') {
        const username = user.username; // Récupérer le nom d'utilisateur de la personne qui a fait la commande
        const userDoc = await getUserDocumentByUsername(username);
        
        if (!userDoc) {
            await interaction.reply({ content: `Vous n'avez pas encore de compte MyEasyKey... Si vous souhaitez en créer un, entrez la commande "/create_account"`, ephemeral: true });
            return;
        }

        const userToken = userDoc.token;
        const time = interaction.options.getString('time');

        if (!time) {
            await interaction.reply({ content: 'L\'heure ne peut pas être vide.', ephemeral: true });
            return;
        }

        try {
            await updateSettings(userToken, time);
            await interaction.reply({ content: `L'heure du changement automatique a bien été définie sur ${time}.`, ephemeral: true });
        } catch (error) {
            if (error.message === 'Le format de l\'heure est incorrect.') {
                await interaction.reply({ content: 'Le format de l\'heure est incorrect. Utilisez le format HH:MM (ex: 17:28).', ephemeral: true });
            } else {
                await interaction.reply({ content: `Une erreur est survenue lors de la mise à jour des paramètres: ${error.message}`, ephemeral: true });
            }
            console.error(error);
        }
    } else if (commandName === "change_my_key") {
        const userDocument = await getUserDocumentByUsername(user.username);

        if (userDocument) {
            const accessCode = userDocument.token;
            await changeSpecificKey(accessCode);
            await interaction.reply({
                content: `Votre clé a été changée avec succès.`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: 'Vous n\'avez pas encore de compte. Utilisez la commande /create_account pour en créer un.',
                ephemeral: true
            });
        }
    }
});

client.login(token);