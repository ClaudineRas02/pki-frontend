# 📱 Frontend Setup (React Native)

## 📲 1. Installer l’application mobile

Télécharger **Expo Go** :

- Android / iOS → Expo Go

---

## 🌐 2. Configurer l’API

Modifier le fichier [`services/apiConfig.js`](services/apiConfig.js)
⚠️ Remplacer l’IP par celle de ta machine
(elle doit être sur le même réseau que ton téléphone)

```js
export const API_BASE_URL = "http://10.231.208.134:3000/api";
```

## 📲 3. Lancer le frontend

```bash
    npm install
    npm run start
```

## 🌐 4. Accéder à l’application

- entrer url ou scanner le codeqr pour accéder à l interface sur phone
