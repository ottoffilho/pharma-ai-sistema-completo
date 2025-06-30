// Dashboard de Produção - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import React from 'react';
import { useAuthSimple } from '../hooks/useAuthSimple';
import { useProducao } from '@/hooks/useProducao';
import type { DashboardProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Dashboard de Produção - Acesso para Manipuladores
 * Conectado diretamente ao banco de dados - SEM dados mockados
 */
export const DashboardProducao: React.FC<DashboardProps> = ({ usuario, permissoes }) => {
  const { logout } = useAuthSimple();
  const navigate = useNavigate();
  const { 
    ordensAndamento, 
    statistics, 
    loading, 
    error, 
    refreshData 
  } = useProducao();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando dados de produção...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Erro ao carregar dados</h3>
          <p className="text-gray-600">{error}</p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard de Produção
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                Manipulador
              </span>
              <Button
                onClick={refreshData}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Visão Geral da Produção - DADOS REAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Ordens em Produção */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Em Produção
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.ordensEmProducao} {statistics.ordensEmProducao === 1 ? 'ordem' : 'ordens'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Aguardando Execução */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Aguardando
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.ordensAguardando} {statistics.ordensAguardando === 1 ? 'ordem' : 'ordens'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Finalizadas Hoje */}
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
                      Finalizadas Hoje
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.ordensFinalizadasHoje} {statistics.ordensFinalizadasHoje === 1 ? 'ordem' : 'ordens'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Status Geral */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Ordens
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.totalOrdens} {statistics.totalOrdens === 1 ? 'ordem' : 'ordens'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Ações de Produção */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Navegação de Produção
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Escolha o tipo de interface mais adequado para sua função
              </p>
            </div>
            <div className="p-6">
              {/* Dois tipos de interface */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Visão Executiva */}
                <a
                  href="/admin/producao/overview"
                  className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Visão Executiva</h4>
                      <p className="text-sm text-gray-500 mt-1">Dashboard com métricas, indicadores e resumo geral</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">📊 Métricas</span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">⚡ Tempo Real</span>
                      </div>
                    </div>
                  </div>
                </a>

                {/* Central Operacional */}
                <a
                  href="/admin/producao"
                  className="p-6 border-2 border-purple-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Central Operacional</h4>
                      <p className="text-sm text-gray-500 mt-1">Interface completa para gerenciar todas as ordens</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">🔧 Operacional</span>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">📋 CRUD</span>
                      </div>
                    </div>
                  </div>
                </a>

              </div>

              {/* Ações Rápidas */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Ações Rápidas</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Iniciar Produção */}
                  <a
                    href="/admin/producao/nova"
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Nova Ordem</p>
                        <p className="text-xs text-gray-500">Iniciar produção</p>
                      </div>
                    </div>
                  </a>

                  {/* Controle de Qualidade */}
                  <a
                    href="/admin/producao"
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Qualidade</p>
                        <p className="text-xs text-gray-500">Verificar lotes</p>
                      </div>
                    </div>
                  </a>

                  {/* Relatórios */}
                  <a
                    href="/admin/producao/relatorios"
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Relatórios</p>
                        <p className="text-xs text-gray-500">Análises</p>
                      </div>
                    </div>
                  </a>

                  {/* Estoque de Insumos */}
                  <a
                    href="/admin/estoque/insumos"
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Insumos</p>
                        <p className="text-xs text-gray-500">Verificar estoque</p>
                      </div>
                    </div>
                  </a>

                </div>
              </div>
            </div>
          </div>

          {/* Ordens em Andamento - DADOS REAIS */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Ordens em Andamento
              </h3>
            </div>
            <div className="p-6">
              {ordensAndamento.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ordem em andamento</h4>
                  <p className="text-gray-500 mb-4">Não há ordens de produção em execução no momento.</p>
                  <Button asChild>
                    <a href="/admin/producao/nova">Iniciar nova ordem</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ordensAndamento.map((ordem) => (
                    <div key={ordem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          ordem.prioridade === 'urgente' ? 'bg-red-500' :
                          ordem.prioridade === 'alta' ? 'bg-orange-500' :
                          ordem.prioridade === 'normal' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Ordem {ordem.numero_ordem}</h4>
                          <p className="text-xs text-gray-500">{ordem.produto_nome || 'Produto não especificado'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">Status: {ordem.status}</p>
                        <p className="text-xs text-gray-500">
                          Criado: {ordem.data_criacao ? new Date(ordem.data_criacao).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas de Produtividade - DADOS REAIS */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Minha Produtividade
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Ordens do Mês */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.ordensDoMes}
                  </div>
                  <div className="text-sm text-gray-500">Ordens no Mês</div>
                </div>

                {/* Taxa de Sucesso */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.taxaSucesso.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Taxa de Sucesso</div>
                </div>

                {/* Status */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.proximoPrazo || 'Atualizado'}
                  </div>
                  <div className="text-sm text-gray-500">Status Geral</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}; 