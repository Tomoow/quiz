# Step 1 in detail: Set up your `.env` file for Firebase

## What “copy .env.example to .env” means

- **`.env.example`** is a **template** file in your project. It lists the variable names your app needs, but with empty or placeholder values. This file is safe to commit to Git.
- **`.env`** is the file where you put your **real** Firebase values (API key, project ID, etc.). This file is usually **not** committed to Git (it’s in `.gitignore`) so your secrets stay private.

“Copy .env.example to .env” means: **create a new file named `.env` in the same folder as `.env.example`, with the same structure, then fill in your real values.**

---

## What to do, step by step

### 1. Create the `.env` file

- Open your **quiz-pwa** project folder (the same folder that contains `package.json`, `src/`, and `.env.example`).
- **Duplicate** the file `.env.example`:
  - **Mac:** Right‑click `.env.example` → Duplicate. Rename the copy to `.env` (delete the “ copy” part so the name is exactly `.env`).
  - **Windows:** Right‑click `.env.example` → Copy, then Paste. Rename the copy to `.env`.
  - **Or:** Open `.env.example` in a text editor, copy all the text, create a new file named `.env` in the same folder, paste the text, and save.

The `.env` file must sit in the **root** of the quiz-pwa project (next to `package.json` and `.env.example`), not inside `src/` or anywhere else.

### 2. Get your Firebase config values

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Select your project (or create one).
3. Click the **gear icon** next to “Project Overview” → **Project settings**.
4. Scroll to **“Your apps”**. If you don’t have a web app yet:
   - Click **“</>” (Web)** to add a web app.
   - Give it a nickname (e.g. “Quiz PWA”) and register. You don’t need Firebase Hosting for this step.
5. In the “Your apps” section you’ll see a **config** object, e.g.:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123..."
   };
   ```

   You can also click **“Config”** (or the config icon) to see these values.

### 3. Fill in `.env` with those values

Open `.env` in a text editor. It should look like this (from `.env.example`):

```
# Firebase – get these from Firebase Console > Project settings > Your apps > Web app
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# If these are empty, the app falls back to localStorage (no real-time sync).
```

Replace the right-hand sides with the values from the Firebase config:

| Line in `.env` | Where it comes from in Firebase config |
|----------------|----------------------------------------|
| `VITE_FIREBASE_API_KEY=` | `apiKey` (paste the value, no quotes in .env) |
| `VITE_FIREBASE_AUTH_DOMAIN=` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID=` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET=` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID=` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID=` | `appId` |

**Example** (with fake values):

```
# Firebase – get these from Firebase Console > Project settings > Your apps > Web app
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=my-quiz-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-quiz-app
VITE_FIREBASE_STORAGE_BUCKET=my-quiz-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:def456xyz

# If these are empty, the app falls back to localStorage (no real-time sync).
```

- **No spaces** around the `=` sign.
- **No quotes** around the values (unless Firebase gives you a value that contains spaces, then you can use quotes).
- **No commas** at the end of lines.

Save the file.

### 4. Restart the dev server

Vite only reads `.env` when it starts. So:

1. Stop the dev server (Ctrl+C in the terminal where `npm run dev` is running).
2. Start it again: `npm run dev`.

After that, the app will use Firebase with the credentials from `.env`. If any of the three main ones (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`) are missing or empty, the app will fall back to localStorage and won’t connect to Firestore.

---

## Summary

- **“Copy .env.example to .env”** = create a new file named `.env` in the project root with the same variable names, then paste your real Firebase config values from the Firebase Console into that file.
- **Where the values come from:** Firebase Console → Project settings → Your apps → your web app’s config (`apiKey`, `authDomain`, `projectId`, etc.).
- **After editing `.env`:** Restart `npm run dev` so the app picks up the new values.
