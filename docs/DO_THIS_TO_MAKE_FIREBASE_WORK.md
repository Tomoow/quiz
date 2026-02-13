# Do this to make Firebase work

Your `.env` is already set up with project **quiz-pwa-e4f17**. You only need to deploy the Firestore rules so the app can read/write `orders`, `menu`, and `tables`.

---

## 1. In the terminal (from the quiz-pwa folder)

Install dependencies (if you haven’t recently), then run these in order:

```bash
npm install

# Log in to Firebase (opens browser; do once)
npm run firebase:login

# Link this folder to your Firebase project (pick quiz-pwa-e4f17 when asked)
npm run firebase:use

# Deploy the security rules (this fixes "Missing or insufficient permissions")
npm run firebase:deploy-rules
```

The Firebase CLI is installed in the project (`firebase-tools`), so you don’t need a global install.

---

## 2. Restart the dev server

Stop `npm run dev` (Ctrl+C), then start it again:

```bash
npm run dev
```

After that, the app should connect to Firestore and Admin changes (menu, tables) should work without permission errors.

---

## If you don’t have a Firebase project yet

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** → follow the steps (you can turn off Analytics if you want).
3. In the project: **Build** → **Firestore Database** → **Create database** → choose **Start in test mode** (we’ll use our own rules from the repo).
4. **Project settings** (gear) → **Your apps** → **</>** (Web) → register the app → copy the config into your `.env` (the 6 `VITE_FIREBASE_*` variables).
5. Then run the terminal steps above (`firebase use --add`, then `firebase deploy --only firestore:rules`).

You don’t need to change any rules in the Firebase Console; deploying from the repo overwrites them with the rules in `firestore.rules`.
