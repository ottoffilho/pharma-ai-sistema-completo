// =====================================================
// CONFIGURAÇÃO DO SUPABASE - PHARMA.AI
// Cliente e configurações para integração com banco
// =====================================================

import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Re-exportar o cliente supabase
export { supabase } from '@/integrations/supabase/client';

// Configurações do ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
  );
}

// =====================================================
// CONFIGURAÇÕES DE TABELAS
// =====================================================

export const TABLES = {
  // Módulo M01 - Cadastros Essenciais
  FORNECEDOR: 'fornecedores',
  CATEGORIA_PRODUTO: 'categoria_produto',
  FORMA_FARMACEUTICA: 'forma_farmaceutica',
  PRODUTO: 'produtos', // Nova tabela unificada
  INSUMO: 'produtos', // Alias para compatibilidade
  EMBALAGEM: 'produtos', // Alias para compatibilidade  
  
  // Módulo M04 - Gestão de Estoque
  LOTE: 'lote',
  
  // Módulo M10 - Fiscal
  NOTA_FISCAL: 'notas_fiscais',
  ITEM_NOTA_FISCAL: 'itens_nota_fiscal',
} as const;

// =====================================================
// CONFIGURAÇÕES DE RLS (ROW LEVEL SECURITY)
// =====================================================

export const RLS_POLICIES = {
  // Políticas básicas para usuários autenticados
  SELECT_AUTHENTICATED: 'Usuários autenticados podem visualizar',
  INSERT_AUTHENTICATED: 'Usuários autenticados podem inserir',
  UPDATE_AUTHENTICATED: 'Usuários autenticados podem atualizar',
  DELETE_AUTHENTICATED: 'Usuários autenticados podem deletar',
} as const;

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return !!session;
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
  return user;
};

/**
 * Obtém a sessão atual
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
  return session;
};

/**
 * Faz logout do usuário
 */
export const signOut = async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};

// =====================================================
// CONFIGURAÇÕES DE STORAGE
// =====================================================

export const STORAGE_BUCKETS = {
  NF_XML: 'nf-xml', // Para armazenar XMLs de notas fiscais
  DOCUMENTOS: 'documentos', // Para documentos gerais
  IMAGENS: 'imagens', // Para imagens de produtos
  RECEITAS: 'receitas', // Para armazenar receitas médicas
} as const;

/**
 * Upload de arquivo para o storage
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
) => {
  try {
    // Tentar upload diretamente - se o bucket não existir, o Supabase retornará erro específico
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, options);

    if (error) {
      // Verificar se é erro de bucket não encontrado
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket does not exist')) {
        console.error(`Bucket ${bucket} não encontrado. Contate o administrador do sistema.`);
        throw new Error(`Bucket ${bucket} não encontrado. Contate o administrador do sistema.`);
      }
      
      // Outros erros de upload
      console.error('Erro no upload:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
};

/**
 * Obtém URL pública de um arquivo
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Download de arquivo do storage
 */
export const downloadFile = async (bucket: string, path: string) => {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Erro no download:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro no download:', error);
    throw error;
  }
};

/**
 * Obtém URL assinada para download seguro
 */
export const getSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Erro ao gerar URL assinada:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error);
    throw error;
  }
};

// =====================================================
// CONFIGURAÇÕES DE REALTIME
// =====================================================

/**
 * Subscreve a mudanças em uma tabela
 */
export const subscribeToTable = (
  table: string,
  callback: (payload: unknown) => void,
  filter?: string
) => {
  const channel = supabaseClient
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter
      },
      callback
    )
    .subscribe();
  
  return channel;
};

/**
 * Remove subscrição
 */
export const unsubscribeFromTable = (channel: ReturnType<typeof subscribeToTable>) => {
  return supabaseClient.removeChannel(channel);
};

// =====================================================
// TRATAMENTO DE ERROS
// =====================================================

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Formata erros do Supabase para exibição
 */
export const formatSupabaseError = (error: unknown): string => {
  if (!error) return 'Erro desconhecido';
  
  const errorMessage = (error as { message?: string })?.message;
  
  // Erros de autenticação
  if (errorMessage?.includes('Invalid login credentials')) {
    return 'Credenciais inválidas. Verifique email e senha.';
  }
  
  if (errorMessage?.includes('Email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  }
  
  // Erros de validação
  if (errorMessage?.includes('duplicate key value')) {
    return 'Registro já existe. Verifique os dados informados.';
  }
  
  if (errorMessage?.includes('violates foreign key constraint')) {
    return 'Erro de relacionamento. Verifique as dependências.';
  }
  
  if (errorMessage?.includes('violates not-null constraint')) {
    return 'Campo obrigatório não preenchido.';
  }
  
  // Erros de RLS
  if (errorMessage?.includes('Row Level Security')) {
    return 'Acesso negado. Verifique suas permissões.';
  }
  
  // Retorna a mensagem original se não houver tratamento específico
  return errorMessage || 'Erro interno do servidor';
};

// =====================================================
// CONFIGURAÇÕES DE PERFORMANCE
// =====================================================

/**
 * Configurações padrão para queries
 */
export const DEFAULT_QUERY_CONFIG = {
  // Limite padrão para listagens
  DEFAULT_LIMIT: 50,
  
  // Limite máximo para evitar sobrecarga
  MAX_LIMIT: 1000,
  
  // Timeout para queries longas (em ms)
  QUERY_TIMEOUT: 30000,
  
  // Configurações de cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
} as const;

/**
 * Aplica configurações padrão a uma query
 */
export const applyDefaultConfig = (query: unknown, limit?: number) => {
  const finalLimit = Math.min(
    limit || DEFAULT_QUERY_CONFIG.DEFAULT_LIMIT,
    DEFAULT_QUERY_CONFIG.MAX_LIMIT
  );
  
  return (query as { limit: (n: number) => unknown }).limit(finalLimit);
};

// =====================================================
// HEALTH CHECK
// =====================================================

/**
 * Verifica a conectividade com o Supabase
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const { error } = await supabaseClient
      .from('fornecedores')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Health check falhou:', error);
    return false;
  }
};

/**
 * Testa se um bucket está acessível
 */
export const testBucketAccess = async (bucketName: string): Promise<boolean> => {
  try {
    // Tentar listar arquivos do bucket (mesmo que vazio)
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`Erro ao acessar bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucketName} está acessível. Arquivos encontrados:`, data?.length || 0);
    return true;
  } catch (error) {
    console.error(`Erro ao testar bucket ${bucketName}:`, error);
    return false;
  }
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default supabaseClient; 