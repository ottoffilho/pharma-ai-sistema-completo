// Router de Dashboards - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAuthSimple } from '../hooks/useAuthSimple';
import DashboardMinimo from './DashboardMinimo';
import AdminDashboard from '@/pages/admin/index';
import { AcessoNegado } from './ProtectedComponent';
import { PerfilUsuario, type TipoDashboard } from '../types';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { log, error as logError } from '@/lib/logger';
import { Navigate } from 'react-router-dom';

/**
 * Router principal para dashboards baseado no perfil do usuário
 * Versão adaptada para sistema multi-farmácia
 */
export const DashboardRouter: React.FC = () => {
  const { usuario, carregando, autenticado, erro } = useAuthSimple();
  const [tempoCarregamento, setTempoCarregamento] = useState(0);
  const [mostrarDebug, setMostrarDebug] = useState(false);

  // Timer para acompanhar tempo de carregamento
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (carregando) {
      interval = setInterval(() => {
        setTempoCarregamento(prev => prev + 1);
      }, 1000);
    } else {
      setTempoCarregamento(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [carregando]);

  // Debug logs
  useEffect(() => {
    log('📊 DashboardRouter - Estado:', {
      carregando,
      autenticado,
      usuario: usuario ? 'presente' : 'ausente',
      erro,
      tempoCarregamento
    });
  }, [carregando, autenticado, usuario, erro, tempoCarregamento]);

  // Loading state melhorado com debug
  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">Carregando dashboard...</p>
                <p className="text-sm text-gray-400">Aguarde um momento... ({tempoCarregamento}s)</p>
                
                {tempoCarregamento > 5 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-amber-600 text-sm">Carregamento demorado detectado...</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setMostrarDebug(!mostrarDebug)}
                    >
                      {mostrarDebug ? 'Ocultar' : 'Mostrar'} Debug
                    </Button>
                    
                    {mostrarDebug && (
                      <div className="text-left bg-gray-100 p-3 rounded text-xs space-y-1">
                        <div>Carregando: {carregando ? 'Sim' : 'Não'}</div>
                        <div>Autenticado: {autenticado ? 'Sim' : 'Não'}</div>
                        <div>Usuário: {usuario ? 'Presente' : 'Ausente'}</div>
                        <div>Erro: {erro || 'Nenhum'}</div>
                        <div>Tempo: {tempoCarregamento}s</div>
                      </div>
                    )}
                  </div>
                )}
                
                {tempoCarregamento > 10 && (
                  <div className="mt-4">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recarregar Página
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erro de autenticação
  if (erro && !autenticado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro de Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{erro}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Ir para Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!autenticado || !usuario) {
    log('❌ DashboardRouter - Não autenticado ou sem usuário');
    return (
      <AcessoNegado
        titulo="Acesso Não Autorizado"
        mensagem="Você precisa estar logado para acessar esta área."
        className="min-h-screen"
      />
    );
  }

  // Verificação de integridade dos dados do usuário
  if (!usuario.usuario || !usuario.usuario.perfil) {
    logError('❌ DashboardRouter - Dados de usuário incompletos:', usuario);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Dados Incompletos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Os dados do usuário estão incompletos. Isso pode indicar um problema com as permissões ou configuração do perfil.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Fazer Login Novamente
              </Button>
              <Button 
                variant="outline"
                onClick={() => setMostrarDebug(!mostrarDebug)}
                className="w-full"
              >
                {mostrarDebug ? 'Ocultar' : 'Mostrar'} Debug
              </Button>
            </div>
            
            {mostrarDebug && (
              <div className="text-left bg-gray-100 p-3 rounded text-xs space-y-1">
                <div>Usuário completo: {JSON.stringify(usuario, null, 2)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados do usuário
  const { dashboard: tipoDashboard, usuario: usuarioData, permissoes } = usuario;
  const perfilUsuario = usuarioData.perfil?.tipo;

  log('🎯 DashboardRouter - Dashboard:', tipoDashboard, 'Perfil:', perfilUsuario);

  // Lógica por perfil
  if (perfilUsuario === PerfilUsuario.MANIPULADOR) {
    return <Navigate to="/admin/producao/overview" replace />;
  }

  // Perfis restantes visualizam dashboard administrativo
  return <AdminDashboard />;
};

/**
 * Hook para obter informações do dashboard atual
 * Adaptado para sistema multi-farmácia
 */
export const useDashboardInfo = () => {
  const { usuario } = useAuthSimple();
  
  return useMemo(() => {
    const perfilUsuario = usuario?.usuario.perfil?.tipo;
    
    // Se é proprietário, sempre retornar informações do dashboard do proprietário
    if (perfilUsuario === PerfilUsuario.PROPRIETARIO) {
      return {
        tipoDashboard: 'proprietario' as TipoDashboard,
        titulo: 'Dashboard do Proprietário',
        descricao: 'Visão consolidada de todas as farmácias da rede',
        perfilUsuario: PerfilUsuario.PROPRIETARIO,
        isProprietario: true,
        contextoMultiFarmacia: usuario?.contexto_multi_farmacia
      };
    }

    const getDashboardTitle = (tipo: TipoDashboard): string => {
      switch (tipo) {
        case 'administrativo':
          return 'Dashboard Administrativo';
        case 'operacional':
          return 'Dashboard Operacional';
        case 'atendimento':
          return 'Painel de Atendimento';
        case 'producao':
          return 'Dashboard de Produção';
        default:
          return 'Dashboard';
      }
    };

    const getDashboardDescription = (tipo: TipoDashboard): string => {
      switch (tipo) {
        case 'administrativo':
          return 'Visão completa da farmácia com acesso a todos os módulos';
        case 'operacional':
          return 'Controle operacional e de produção';
        case 'atendimento':
          return 'Ferramentas para atendimento ao cliente';
        case 'producao':
          return 'Controle de produção e manipulação';
        default:
          return '';
      }
    };

    return {
      tipoDashboard: usuario?.dashboard,
      titulo: usuario?.dashboard ? getDashboardTitle(usuario.dashboard) : '',
      descricao: usuario?.dashboard ? getDashboardDescription(usuario.dashboard) : '',
      perfilUsuario: perfilUsuario,
      isProprietario: false,
      contextoMultiFarmacia: usuario?.contexto_multi_farmacia
    };
  }, [usuario?.dashboard, usuario?.usuario.perfil?.tipo, usuario?.contexto_multi_farmacia]);
};

/**
 * Hook para verificar se o usuário atual é proprietário
 */
export const useIsProprietario = () => {
  const { usuario } = useAuthSimple();
  
  return useMemo(() => {
    const perfilUsuario = usuario?.usuario.perfil?.tipo;
    return perfilUsuario === PerfilUsuario.PROPRIETARIO;
  }, [usuario?.usuario.perfil?.tipo]);
};

/**
 * Hook para acessar contexto multi-farmácia
 */
export const useContextoMultiFarmacia = () => {
  const { usuario } = useAuthSimple();
  
  return useMemo(() => {
    return usuario?.contexto_multi_farmacia || null;
  }, [usuario?.contexto_multi_farmacia]);
}; 