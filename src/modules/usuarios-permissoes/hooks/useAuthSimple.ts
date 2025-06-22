// Hook de Autenticação Simplificado - Pharma.AI
import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SessaoUsuario, RespostaAuth } from '../types';
import { NivelAcesso, ModuloSistema, AcaoPermissao, TipoDashboard, PerfilUsuario } from '../types';
import { log, error as logError } from '@/lib/logger';

interface AuthContextType {
  usuario: SessaoUsuario | null;
  carregando: boolean;
  autenticado: boolean;
  login: (email: string, senha: string) => Promise<RespostaAuth>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  erro: string | null;
}

// Cache local para reduzir chamadas repetidas
interface AuthCache {
  usuario: SessaoUsuario | null;
  timestamp: number;
  valido: boolean;
}

// TTL do cache em milissegundos (5 minutos - aumentado para reduzir consultas)
const CACHE_TTL = 5 * 60 * 1000;

// Timeout de segurança reduzido para 8 segundos (mais rápido)
const SAFETY_TIMEOUT = 8 * 1000;

// Máximo de tentativas para carregar usuário - mantido em 1 para evitar loops
const MAX_TENTATIVAS = 1;

// Contador global de erros para detectar loops entre recarregamentos
const getErrorCountFromSession = (): number => {
  try {
    const count = sessionStorage.getItem('auth_error_count');
    return count ? parseInt(count, 10) : 0;
  } catch (e) {
    return 0;
  }
};

const incrementErrorCount = (): number => {
  try {
    const count = getErrorCountFromSession() + 1;
    sessionStorage.setItem('auth_error_count', count.toString());
    return count;
  } catch (e) {
    return 1;
  }
};

const resetErrorCount = (): void => {
  try {
    sessionStorage.removeItem('auth_error_count');
  } catch (e) {
    // Ignorar erros
  }
};

export const AuthSimpleContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthSimple = () => {
  const context = useContext(AuthSimpleContext);
  if (context === undefined) {
    throw new Error('useAuthSimple deve ser usado dentro de um AuthSimpleProvider');
  }
  return context;
};

// Tentar recuperar cache do sessionStorage com fallback
const recuperarCache = (): AuthCache | null => {
  try {
    // Tentar sessionStorage primeiro
    let cacheData = sessionStorage.getItem('auth_cache');
    
    // Se não encontrar no sessionStorage, tentar localStorage como fallback
    if (!cacheData) {
      cacheData = localStorage.getItem('auth_cache_backup');
    }
    
    if (cacheData) {
      const cache = JSON.parse(cacheData) as AuthCache;
      const agora = Date.now();
      
      // Se o cache ainda é válido
      if (cache.valido && (agora - cache.timestamp) < CACHE_TTL) {
        log('✅ Cache de autenticação válido encontrado');
        return cache;
      } else {
        log('⚠️ Cache de autenticação expirado, removendo...');
        // Limpar cache expirado
        sessionStorage.removeItem('auth_cache');
        localStorage.removeItem('auth_cache_backup');
      }
    }
  } catch (error) {
    log('⚠️ Erro ao recuperar cache:', error);
    // Limpar cache corrompido
    try {
      sessionStorage.removeItem('auth_cache');
      localStorage.removeItem('auth_cache_backup');
    } catch (e) {
      // Ignorar erros de limpeza
    }
  }
  return null;
};

// Salvar dados no cache com backup
const salvarCache = (usuario: SessaoUsuario | null) => {
  try {
    const cache: AuthCache = {
      usuario,
      timestamp: Date.now(),
      valido: true
    };
    const cacheString = JSON.stringify(cache);
    
    // Salvar no sessionStorage (principal)
    sessionStorage.setItem('auth_cache', cacheString);
    
    // Backup no localStorage (para persistir entre abas)
    localStorage.setItem('auth_cache_backup', cacheString);
    
    log('✅ Cache de autenticação salvo');
  } catch (error) {
    log('⚠️ Erro ao salvar cache:', error);
  }
};

// Invalidar cache completamente
const invalidarCache = () => {
  try {
    sessionStorage.removeItem('auth_cache');
    localStorage.removeItem('auth_cache_backup');
    log('🗑️ Cache de autenticação invalidado');
  } catch (error) {
    log('⚠️ Erro ao invalidar cache:', error);
  }
};

// Verificar se o erro é relacionado a tabela não encontrada
const isTableNotFoundError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error as { message?: string; details?: string }).message || 
      (error as { details?: string }).details || 
      JSON.stringify(error);
  
  return errorMessage.includes('relation') && 
         (errorMessage.includes('does not exist') || 
          errorMessage.includes('não existe') ||
          errorMessage.includes('not found'));
};

export const useAuthSimpleState = () => {
  // Estados básicos
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ultimoErro, setUltimoErro] = useState<string | null>(null);
  
  // Refs para controle
  const isMountedRef = useRef(true);
  const carregandoRef = useRef(false);

  // Função para forçar logout em emergência
  const forceLogout = useCallback(() => {
    try {
      log('🚨 useAuthSimple - Logout forçado iniciado');
      supabase.auth.signOut();
      invalidarCache();
      sessionStorage.clear();
      setUsuario(null);
      setCarregando(false);
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (e) {
      logError('❌ useAuthSimple - Erro no logout forçado:', e);
      window.location.href = '/login';
    }
  }, []);

  // Carregar dados do usuário
  const carregarUsuario = useCallback(async () => {
    if (carregandoRef.current) {
      log('⚠️ useAuthSimple - Carregamento já em andamento');
      return;
    }

    carregandoRef.current = true;
    
    try {
      log('🔄 useAuthSimple - Carregando usuário...');
      
      // Verificar sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        log('⚠️ useAuthSimple - Sem sessão ativa');
        if (isMountedRef.current) {
          setUsuario(null);
          setCarregando(false);
          invalidarCache();
        }
        carregandoRef.current = false;
        return;
      }

      const user = session.user;
      log('✅ useAuthSimple - Sessão encontrada:', user.email);

      // Primeiro, buscar apenas dados básicos do usuário usando RPC para evitar recursão RLS
      log('🔍 useAuthSimple - Buscando dados básicos do usuário via RPC...');
      const { data: userRpcData, error: userRpcError } = await supabase
        .rpc('get_logged_user_data');

      if (userRpcError || !userRpcData || userRpcData.error) {
        logError('❌ useAuthSimple - Erro ao buscar usuário via RPC:', userRpcError || userRpcData?.error);
        
        // Se o erro indica que o usuário está inativo, abortar login e forçar logout
        if (userRpcData?.error?.toLowerCase().includes('inativo')) {
          log('🚫 useAuthSimple - Usuário inativo, abortando login');
          await supabase.auth.signOut();
          if (isMountedRef.current) {
            setUltimoErro('Usuário inativo. Contate o administrador.');
            setCarregando(false);
          }
          carregandoRef.current = false;
          return;
        }

        // Se for erro de "usuário não encontrado" (mas não inativo), tentar criar usuário automaticamente
        if (userRpcData?.error === 'Usuário não encontrado') {
          log('🔄 useAuthSimple - Usuário não encontrado, tentando criar...');
          try {
            const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
            
            const { data: createResult, error: createRpcError } = await supabase
              .rpc('create_user_auto', {
                user_email: user.email,
                user_name: userName,
                auth_user_id: user.id
              });

            if (createRpcError || !createResult?.success) {
              logError('❌ useAuthSimple - Erro ao criar usuário via RPC:', createRpcError || createResult?.error);
              if (isMountedRef.current) {
                setUltimoErro('Erro ao criar perfil de usuário');
                setCarregando(false);
              }
              carregandoRef.current = false;
              return;
            }

            log('✅ useAuthSimple - Usuário criado automaticamente via RPC');
            // Recursivamente chamar a função para carregar o usuário recém-criado
            carregandoRef.current = false;
            return await carregarUsuario();
          } catch (createError) {
            logError('❌ useAuthSimple - Exceção ao criar usuário:', createError);
            if (isMountedRef.current) {
              setUltimoErro('Erro ao criar perfil de usuário');
              setCarregando(false);
            }
            carregandoRef.current = false;
            return;
          }
        }
        
        if (isMountedRef.current) {
          setUltimoErro('Usuário não encontrado ou inativo');
          setCarregando(false);
        }
        carregandoRef.current = false;
        return;
      }

      const userData = userRpcData.usuario;
      const perfilUsuario = userRpcData.perfil;
      log('✅ useAuthSimple - Dados básicos do usuário carregados via RPC');

      // Buscar permissões usando RPC
      let permissoes: any[] = [];
      try {
        log('🔍 useAuthSimple - Buscando permissões via RPC...');
        const { data: permissoesRpcData, error: permissoesRpcError } = await supabase
          .rpc('get_user_permissions');

        if (!permissoesRpcError && permissoesRpcData && !permissoesRpcData.error) {
          permissoes = permissoesRpcData.map((p: any) => ({
            id: p.id,
            modulo: p.modulo as ModuloSistema,
            acao: p.acao as AcaoPermissao,
            nivel: NivelAcesso.TODOS,
            perfil_id: p.perfil_id,
            permitido: p.permitido,
            criado_em: p.criado_em,
            condicoes: null
          }));
          log('✅ useAuthSimple - Permissões carregadas via RPC:', permissoes.length);
        } else {
          log('⚠️ useAuthSimple - Erro ao carregar permissões via RPC:', permissoesRpcError || permissoesRpcData?.error);
        }
      } catch (permissoesError) {
        log('⚠️ useAuthSimple - Exceção ao carregar permissões via RPC:', permissoesError);
      }

      // Montar objeto do perfil
      const perfilObj = perfilUsuario ? {
        id: perfilUsuario.id,
        nome: perfilUsuario.nome,
        tipo: perfilUsuario.tipo as PerfilUsuario,
        dashboard: perfilUsuario.dashboard_padrao as TipoDashboard || TipoDashboard.ADMINISTRATIVO,
        permissoes,
        ativo: userData.ativo,
        created_at: '',
        updated_at: ''
      } : undefined;

      // Montar objeto do usuário
      const usuarioObj = {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        telefone: userData.telefone || undefined,
        perfil_id: userData.perfil_id,
        perfil: perfilObj,
        ativo: userData.ativo,
        ultimo_acesso: userData.ultimo_acesso || undefined,
        created_at: userData.criado_em || '',
        updated_at: userData.atualizado_em || '',
        auth_id: userData.supabase_auth_id || undefined
      };

      // Montar sessão
      const sessao: SessaoUsuario = {
        usuario: usuarioObj,
        permissoes,
        dashboard: (perfilUsuario?.dashboard_padrao as TipoDashboard) || TipoDashboard.ADMINISTRATIVO
      };

      log('✅ useAuthSimple - Usuário carregado completo:', userData.nome);
      
      salvarCache(sessao);
      
      if (isMountedRef.current) {
        setUsuario(sessao);
        setUltimoErro(null);
        setCarregando(false);
      }

      // Atualizar último acesso em background usando RPC
      setTimeout(async () => {
        try {
          const { data: updateResult, error: updateError } = await supabase
            .rpc('update_last_access');
          
          if (updateResult) {
            log('✅ Último acesso atualizado via RPC');
          } else {
            log('⚠️ Erro ao atualizar último acesso via RPC:', updateError);
          }
        } catch (err) {
          log('⚠️ Exceção ao atualizar último acesso:', err);
        }
      }, 1000);

    } catch (error) {
      logError('❌ useAuthSimple - Erro geral ao carregar usuário:', error);
      if (isMountedRef.current) {
        setUltimoErro('Erro ao carregar dados do usuário');
        setCarregando(false);
      }
    } finally {
      carregandoRef.current = false;
    }
  }, []);

  // Login simplificado
  const login = useCallback(async (email: string, senha: string): Promise<RespostaAuth> => {
    try {
      log('🔐 useAuthSimple - Login:', email);
      setCarregando(true);
      setUltimoErro(null);
      invalidarCache();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error || !data.user) {
        logError('❌ useAuthSimple - Erro de autenticação:', error);
        return { sucesso: false, erro: 'Credenciais inválidas' };
      }

      log('✅ useAuthSimple - Autenticação bem-sucedida');
      
      // Tentar carregar usuário; se falhar (usuário inativo, etc.), tratar erro
      try {
        await carregarUsuario();
        // Após carregar, verificar se o usuário realmente foi definido
        if (!isMountedRef.current || !supabase.auth.getSession) {
          // fallback safety
        }
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (!sessionCheck.session) {
          log('🚫 useAuthSimple - Login abortado (provavelmente usuário inativo)');
          return { sucesso: false, erro: 'Usuário inativo ou sem acesso. Contate o administrador.' };
        }
      } catch (loadError) {
        log('⚠️ useAuthSimple - Erro ao carregar usuário após login, criando sessão básica:', loadError);
        
        // Criar sessão básica em caso de erro
        const sessaoBasica: SessaoUsuario = {
          usuario: {
            id: data.user.id,
            email: data.user.email || email,
            nome: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuário',
            telefone: undefined,
            perfil_id: 'basic',
            perfil: {
              id: 'basic',
              nome: 'Usuário Básico',
              tipo: PerfilUsuario.PROPRIETARIO,
              dashboard: TipoDashboard.ADMINISTRATIVO,
              permissoes: [],
              ativo: true,
              created_at: '',
              updated_at: ''
            },
            ativo: true,
            ultimo_acesso: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            auth_id: data.user.id
          },
          permissoes: [],
          dashboard: TipoDashboard.ADMINISTRATIVO
        };
        
        if (isMountedRef.current) {
          setUsuario(sessaoBasica);
          setUltimoErro('Dados parciais carregados - acesso limitado');
          setCarregando(false);
        }
      }
      
      return { sucesso: true };

    } catch (error) {
      logError('❌ useAuthSimple - Erro no login:', error);
      return { sucesso: false, erro: 'Erro interno' };
    } finally {
      setCarregando(false);
    }
  }, [carregarUsuario]);

  // Logout simplificado
  const logout = useCallback(async () => {
    try {
      invalidarCache();
      await supabase.auth.signOut();
      setUsuario(null);
      window.location.href = '/login';
    } catch (error) {
      logError('Erro no logout:', error);
      throw error instanceof Error ? error : new Error('Erro no logout');
    }
  }, []);

  // Effect principal - SIMPLIFICADO
  useEffect(() => {
    isMountedRef.current = true;
    
    // Verificar cache primeiro
    const cache = recuperarCache();
    if (cache?.usuario) {
      log('🚀 useAuthSimple - Cache válido encontrado');
      setUsuario(cache.usuario);
      setCarregando(false);
      return;
    }
    
    // Se não há cache, carregar usuário
    carregarUsuario();
    
    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (carregando && isMountedRef.current) {
        log('⏰ useAuthSimple - Timeout de segurança');
        setCarregando(false);
      }
    }, SAFETY_TIMEOUT);

    // Listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log('🔄 useAuthSimple - Auth change:', event);
        
        if (event === 'SIGNED_OUT') {
          if (isMountedRef.current) {
            setUsuario(null);
            setCarregando(false);
            invalidarCache();
          }
        } else if (event === 'SIGNED_IN' && session) {
          log('✅ useAuthSimple - Usuário logado');
          await carregarUsuario();
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [carregarUsuario, carregando]);

  return useMemo(() => ({
    usuario,
    carregando,
    autenticado: !!usuario,
    login,
    logout,
    forceLogout,
    erro: ultimoErro
  }), [usuario, carregando, login, logout, forceLogout, ultimoErro]);
}; 