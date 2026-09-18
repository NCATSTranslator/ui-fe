/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_INFO: string;
  /** Optional GTM container ID (GTM-XXXXXXX). Overrides the value from /config. */
  readonly VITE_GTM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}