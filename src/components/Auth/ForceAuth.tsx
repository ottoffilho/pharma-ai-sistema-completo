import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuthSimple } from '@/modules/usuarios-permissoes/hooks/useAuthSimple';
import { Button } from '@/components/ui/button';
import { log, error as logError } from '@/lib/logger';

// Definir aqui se queremos forçar o acesso (apenas para desenvolvimento)
// Só permite FORCE_AUTH em desenvolvimento E com variável de ambiente específica
const FORCE_AUTH = import.meta.env.MODE === 'development' && 
                   import.meta.env.VITE_ENABLE_FORCE_AUTH === 'true';
// Timeout máximo para verificação (10 segundos)
const MAX_VERIFY_TIME = 10000;
// Número máximo de tentativas de carregamento
const MAX_LOADING_RETRIES = 3;

// Contador de tentativas de carregamento (guardado em sessionStorage)
const getLoadingRetries = (): number => {
  try {
    const count = sessionStorage.getItem('auth_loading_retries');
    return count ? parseInt(count, 10) : 0;
  } catch (e) {
    return 0;
  }
};

const incrementLoadingRetries = (): number => {
  try {
    const count = getLoadingRetries() + 1;
    sessionStorage.setItem('auth_loading_retries', count.toString());
    return count;
  } catch (e) {
    return 1;
  }
};

const resetLoadingRetries = (): void => {
  try {
    sessionStorage.removeItem('auth_loading_retries');
  } catch (e) {
    // Ignorar erros
  }
};

/**
 * Componente que protege rotas autenticadas
 * Versão simplificada para melhor performance
 */
function ForceAuth() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();
  const authContext = useAuthSimple();

  useEffect(() => {
    const verificarAutenticacao = async () => {
      try {
        if (FORCE_AUTH) {
          log('🔓 ACESSO FORÇADO ATIVADO');
          setAuthenticated(true);
          setLoading(false);
          return;
        }

        // Usar estado do authContext diretamente
        if (!authContext.carregando) {
          log('🔒 ForceAuth - Estado do auth:', authContext.autenticado ? 'Autenticado' : 'Não autenticado');
          setAuthenticated(authContext.autenticado);
          setLoading(false);
          return;
        }

        // Verificação direta como fallback
        const { data: { session } } = await supabase.auth.getSession();
        const temSessao = !!session;
        
        log('🔒 ForceAuth - Verificação direta:', temSessao ? 'Autenticado' : 'Não autenticado');
        
        setAuthenticated(temSessao);
        setLoading(false);
      } catch (error) {
        logError('❌ ForceAuth - Erro:', error);
        setAuthenticated(false);
        setLoading(false);
      }
    };

    verificarAutenticacao();

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (loading) {
        log('⏰ ForceAuth - Timeout');
        setLoading(false);
        setAuthenticated(authContext.autenticado);
      }
    }, MAX_VERIFY_TIME);

    return () => clearTimeout(timeoutId);
  }, [authContext.carregando, authContext.autenticado, loading]);

  // Sincronizar com mudanças do authContext
  useEffect(() => {
    if (!authContext.carregando) {
      setAuthenticated(authContext.autenticado);
      setLoading(false);
    }
  }, [authContext.carregando, authContext.autenticado]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg mt-4">Verificando acesso...</span>
      </div>
    );
  }

  // Verificar autenticação
  if (!authenticated && !FORCE_AUTH) {
    log('⛔ ForceAuth - Redirecionando para login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  log('✅ ForceAuth - Acesso autorizado');
  return <Outlet />;
}

// Usando export default separado da declaração do componente
export default ForceAuth; 