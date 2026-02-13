/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  /** Optional: shared password to unlock the app (event staff only). */
  readonly VITE_APP_PASSWORD?: string;
  /** Optional: hint shown under "Demo Credentials" on the login screen. */
  readonly VITE_APP_PASSWORD_HINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
