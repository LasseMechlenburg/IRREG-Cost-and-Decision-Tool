/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVBLUE_USERNAME?: string
  readonly VITE_NAVBLUE_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
