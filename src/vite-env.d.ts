/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVBLUE_USERNAME?: string
  readonly VITE_NAVBLUE_PASSWORD?: string
  readonly VITE_OCDC_BASE_URL?: string
  readonly VITE_OCDC_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
