/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_INFO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}