/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional build-time default for the server URL input, e.g. https://teamspace.example.com. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
