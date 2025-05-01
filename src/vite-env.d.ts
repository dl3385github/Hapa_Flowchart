/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  // Add any other env variables used in your app
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 