# My Easy Key
My Easy Key, a program that lets you create and manage temporary keys using Firebase's Firestore Database and Storage

## Patch Notes
My Easy Key 1.0.0, Creation of My Easy Key

## Requirement
My Easy Key require:
```
- @discordjs/rest
- axios
- discord.js
- dotenv
- firebase
- fs
- path
- readline

You can install all the dependencies with the command > npm install @discordjs/rest axios discord.js dotenv firebase fs path readline
```
You have to change the infomations in .env by your Firebase Config, Your Discord Bot token and Your Channel ID
!Warning! DONT EDIT MYEASYKEY_VERSION and MYEASYKEY_BETA_VERSION

## My Easy Key / Discord Bot
> /bot/index.js
Get the tool (index.js) and api (api.js)
Create an account
Obtain account information
Sets up the document linked to the user
Sets up user key in firestore settings file for automatic key change
Set up key storage space
Automatically changes the key at the time entered in the firestore settings file

> /bot/test.js
- /bot/test.js is used to test new features.
obtains the tool (index.js) and the api (api.js)
Allows you to create an account
Provides account information
Sets up the document linked to the user
Sets up user key in firestore settings file for automatic key change
Set up key storage space
Automatically changes key at time entered in firestore settings file

## My Easy Key / Javascript Tool
> index.js
Change key
Set automatic changeover time (5:30pm)
Obtain account information
> api.js
Retrieves code from URL
> admin/reset/used_key.js
Delete all keys already in use
> admin/map/firestore_and_storage.txt
Shows the structure of MyEasyKey
> admin/init/firestore.js
Sets up the document linked to the user
> admin/init/settings.js
Sets up the user's key in the firestore settings file for automatic key changes
> admin/init/storage.js
Sets up key storage space
> admin/init/main.js
Set up user document, user key in firestore settings file for automatic key change and key storage space
> admin/delete/firestore.js
deletes the document linked to the user
> admin/delete/settings.js
deletes the user's key from the firestore settings file for automatic key change
> admin/delete/main.js
Deletes user-related document and user key from firestore settings file for automatic key change.

Translated with DeepL.com (free version)

## My Easy Key / Node.js Package
You can use My Easy Key with this command:
```npm install my-easy-key````

Source Code here of the package : ???

## Author
© Mr-Julus 2024, all rights reserved 