# Quiz Event Orders PWA

Progressive Web App for quiz events: teams at fixed tables order food and drinks. **Screen 1: Order Taking** (venue staff, mobile-first) is implemented; Bar, Rankings, and Admin screens to be added later.

## Firebase backend

When Firebase is configured, the app uses Firestore for **orders**, **menu**, and **tables**. Without Firebase env vars, it falls back to localStorage and static data in `src/data/menu.ts` and `src/data/tables.ts`.

**To make Firebase work (and fix “Missing or insufficient permissions”):**

1. **Env** – Copy `.env.example` to `.env` and fill in your Firebase web app config (Firebase Console → Project settings → Your apps).
2. **Firebase CLI** – Install and log in: `npm install -g firebase-tools` then `firebase login`.
3. **Link project** – From the quiz-pwa root: `firebase use --add` and pick your Firebase project (or create one).
4. **Deploy rules** – Deploy Firestore security rules so the app can read/write `orders`, `menu`, and `tables`:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. **Restart dev server** – Restart `npm run dev` so it picks up `.env`. Then use the app; menu and tables will sync to Firestore and the Admin screen will work.

**Collections:** `orders` (order docs), `menu` (menu items), `tables` (teams/table numbers). If `menu` or `tables` are empty, the app seeds them from `src/data/menu.ts` and `src/data/tables.ts` on first load. See `firestore.rules`; tighten for production (e.g. restrict writes by `request.auth`).

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
