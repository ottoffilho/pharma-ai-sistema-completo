import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Erro: A variável de ambiente VITE_SUPABASE_URL não está definida.");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Aviso: A variável de ambiente VITE_SUPABASE_SERVICE_ROLE_KEY não está definida. Operações administrativas podem falhar.");
}

// Cliente administrativo para operações que requerem privilégios elevados
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Função utilitária para verificar se o cliente admin está disponível
export function isAdminClientAvailable(): boolean {
  return supabaseAdmin !== null;
}

// Função utilitária para obter o cliente admin com verificação
export function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("Cliente administrativo não está disponível. Verifique se VITE_SUPABASE_SERVICE_ROLE_KEY está configurada.");
  }
  return supabaseAdmin;
} 