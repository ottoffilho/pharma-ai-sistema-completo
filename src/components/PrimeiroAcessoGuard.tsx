import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { log, error as logError } from '@/lib/logger';

interface PrimeiroAcessoGuardProps {
  children: React.ReactNode;
}

const PrimeiroAcessoGuard: React.FC<PrimeiroAcessoGuardProps> = ({ children }) => {
  const [verificando, setVerificando] = useState(true);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Timeout de segurança reduzido para 3 segundos
    const timeoutId = setTimeout(() => {
      log('⏰ Timeout de segurança ativado - assumindo que não é primeiro acesso');
      setVerificando(false);
      setPrimeiroAcesso(false);
    }, 3000); // Reduzido de 5 para 3 segundos

    verificarPrimeiroAcesso().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const verificarPrimeiroAcesso = async () => {
    try {
      // Se rota pública ou usuário não autenticado, não verificar
      const rotasPublicas = ['/', '/login', '/esqueci-senha', '/redefinir-senha', '/aceitar-convite'];
      if (rotasPublicas.includes(location.pathname)) {
        log('ℹ️ Rota pública detectada, ignorando verificação de primeiro acesso.');
        setPrimeiroAcesso(false);
        setVerificando(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        log('ℹ️ Usuário não autenticado, ignorando verificação de primeiro acesso.');
        setPrimeiroAcesso(false);
        setVerificando(false);
        return;
      }

      log('🔍 Verificando se é o primeiro acesso...');

      // Usar a função RPC check_first_access() ao invés de consulta direta
      // Esta função contorna o problema de RLS sendo SECURITY DEFINER
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos

      const { data: resultado, error: rpcError } = await supabase
        .rpc('check_first_access')
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (rpcError) {
        logError('❌ Erro ao verificar primeiro acesso via RPC:', rpcError);
        // Em caso de erro, assumir que não é primeiro acesso
        setPrimeiroAcesso(false);
        log('🔄 Assumindo que não é primeiro acesso devido ao erro');
      } else {
        log('✅ Resultado da verificação RPC:', resultado);
        
        // O resultado da função é um JSON com isFirstAccess e userCount
        const isFirstAccess = resultado?.isFirstAccess || false;
        const userCount = resultado?.userCount || 0;
        
        log('📊 Dados do primeiro acesso:', { isFirstAccess, userCount });
        
        if (isFirstAccess) {
          log('🎯 Primeiro acesso detectado - redirecionando para cadastro inicial');
          setPrimeiroAcesso(true);
        } else {
          log('👤 Usuários já existem - permitindo acesso normal');
          setPrimeiroAcesso(false);
        }
      }

    } catch (error) {
      logError('❌ Erro na verificação de primeiro acesso:', error);
      
      // Se for erro de abort/timeout, assumir que não é primeiro acesso
      if (error instanceof Error && error.name === 'AbortError') {
        log('⏰ Timeout na verificação - assumindo que não é primeiro acesso');
      }
      
      setPrimeiroAcesso(false);
    } finally {
      setVerificando(false);
    }
  };

  // Loading state com timeout visual
  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Verificando sistema...</p>
          <p className="text-xs text-gray-400 mt-2">Aguarde alguns segundos...</p>
          <div className="mt-4">
            <button 
              onClick={() => {
                log('🔄 Forçando bypass do primeiro acesso');
                setVerificando(false);
                setPrimeiroAcesso(false);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Pular verificação (Debug)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se é primeiro acesso, redirecionar para página de cadastro inicial
  if (primeiroAcesso) {
    log('🔀 Redirecionando para /primeiro-acesso');
    return <Navigate to="/primeiro-acesso" replace />;
  }

  // Caso contrário, renderizar os children normalmente
  log('✅ Renderizando children normalmente');
  return <>{children}</>;
};

export default PrimeiroAcessoGuard; 