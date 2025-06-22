// Dashboard de Atendimento - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import React, { useState, useEffect } from 'react';
import { useAuthSimple } from '../hooks/useAuthSimple';
import type { DashboardProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Dashboard de Atendimento - Para Atendentes e Balconistas
 */
export const DashboardAtendimento: React.FC<DashboardProps> = ({ usuario, permissoes }) => {
  const { logout } = useAuthSimple();
  const navigate = useNavigate();
  const [pedidosHoje, setPedidosHoje] = useState(0);
  const [metaDiaria, setMetaDiaria] = useState(15);
  const [carregando, setCarregando] = useState(true);

  // Query para buscar pedidos pendentes do usuário atual
  const { data: pedidosPendentes, isLoading: pedidosLoading } = useQuery({
    queryKey: ['pedidosPendentes', usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          cliente_nome,
          status,
          tipo_pedido,
          created_at
        `)
        .or('status.eq.pendente,status.eq.aguardando_aprovacao,status.eq.pronto_entrega')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!usuario?.id
  });

  // Query para buscar produtos em falta ou com estoque baixo
  const { data: produtosEmFalta, isLoading: produtosLoading } = useQuery({
    queryKey: ['produtosEmFalta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insumos')
        .select(`
          nome,
          quantidade_atual,
          quantidade_minima
        `)
        .or('quantidade_atual.eq.0,quantidade_atual.lte.quantidade_minima')
        .order('quantidade_atual', { ascending: true })
        .limit(3);
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  // Mapear status para cores e labels
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string, bgColor: string, borderColor: string, dotColor: string, textColor: string }> = {
      'pendente': {
        label: 'Pendente',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        dotColor: 'bg-yellow-500',
        textColor: 'text-yellow-700'
      },
      'aguardando_aprovacao': {
        label: 'Orçamento',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-700'
      },
      'pronto_entrega': {
        label: 'Pronto',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        dotColor: 'bg-green-500',
        textColor: 'text-green-700'
      }
    };
    
    return statusMap[status] || {
      label: status,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-500',
      textColor: 'text-gray-700'
    };
  };

  useEffect(() => {
    // Simular carregamento de dados do atendente
    const carregarDados = async () => {
      try {
        // Aqui seria uma chamada real para buscar dados do atendente
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPedidosHoje(8);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  const progressoMeta = (pedidosHoje / metaDiaria) * 100;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Painel de Atendimento
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Atendente
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Olá, {usuario.nome}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Métricas Pessoais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Pedidos Hoje */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pedidos Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {carregando ? '...' : pedidosHoje}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Meta Diária */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Meta Diária
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metaDiaria} pedidos
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Progresso da Meta</span>
              <span className="text-sm font-medium text-gray-900">{Math.round(progressoMeta)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressoMeta, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pedidosHoje} de {metaDiaria} pedidos
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Ações Principais */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Ações Rápidas
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Nova Receita */}
                <a
                  href="/admin/pedidos/nova-receita"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Nova Receita</p>
                  <p className="text-xs text-gray-500">Cadastrar receita</p>
                </a>

                {/* Consultar Estoque */}
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Consultar Estoque</p>
                  <p className="text-xs text-gray-500">Verificar disponibilidade</p>
                </button>

                {/* PDV */}
                <a
                  href="/admin/vendas/pdv"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">PDV</p>
                  <p className="text-xs text-gray-500">Ponto de Venda</p>
                </a>

                {/* Orçamentos */}
                <a
                  href="/admin/orcamentos"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Orçamentos</p>
                  <p className="text-xs text-gray-500">Criar orçamento</p>
                </a>

              </div>
            </div>
          </div>

          {/* Pedidos Pendentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Meus Pedidos Pendentes
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                
                {pedidosLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mr-3 animate-pulse"></div>
                        <div>
                          <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-1"></div>
                          <div className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-5 w-16 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                  ))
                ) : pedidosPendentes && pedidosPendentes.length > 0 ? (
                  // Dados reais dos pedidos
                  pedidosPendentes.map((pedido) => {
                    const statusConfig = getStatusConfig(pedido.status);
                    return (
                      <div key={pedido.id} className={`flex items-center justify-between p-3 ${statusConfig.bgColor} rounded-lg border ${statusConfig.borderColor}`}>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 ${statusConfig.dotColor} rounded-full mr-3`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">#{pedido.id} - {pedido.cliente_nome || 'Cliente não informado'}</p>
                            <p className="text-xs text-gray-500">
                              {pedido.tipo_pedido || 'Manipulação'} - {
                                pedido.status === 'pendente' ? 'Aguardando produção' :
                                pedido.status === 'aguardando_aprovacao' ? 'Aguardando aprovação' :
                                pedido.status === 'pronto_entrega' ? 'Pronto para entrega' :
                                pedido.status
                              }
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs ${statusConfig.textColor} ${statusConfig.bgColor.replace('50', '100')} px-2 py-1 rounded-full`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  // Estado quando não há pedidos
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Nenhum pedido pendente</p>
                    <p className="text-xs text-gray-400">Todos os pedidos estão em dia!</p>
                  </div>
                )}

                {/* Ver todos - só mostrar se houver pedidos */}
                {pedidosPendentes && pedidosPendentes.length > 0 && (
                  <div className="text-center pt-2">
                    <a
                      href="/admin/pedidos"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Ver todos os pedidos
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Informações Úteis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Produtos em Falta */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Produtos em Falta
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {produtosLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-5 w-16 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                  ))
                ) : produtosEmFalta && produtosEmFalta.length > 0 ? (
                  produtosEmFalta.map((produto, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{produto.nome}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        produto.quantidade_atual === 0 
                          ? 'text-red-600 bg-red-100' 
                          : 'text-yellow-600 bg-yellow-100'
                      }`}>
                        {produto.quantidade_atual === 0 ? 'Esgotado' : 'Baixo'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Estoque normalizado</p>
                    <p className="text-xs text-gray-400">Nenhum produto em falta</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lembretes e Notificações */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Notificações do Sistema
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h4a1 1 0 001-1v-1a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 001 1h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Sistema atualizado</p>
                  <p className="text-xs text-gray-400">Todas as funcionalidades operando normalmente</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}; 