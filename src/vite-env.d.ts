/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  // Outras variáveis de ambiente que você possa ter
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
