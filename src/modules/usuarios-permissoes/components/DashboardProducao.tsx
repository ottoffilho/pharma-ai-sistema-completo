// Dashboard de Produção - Pharma.AI
// Módulo: M09-USUARIOS_PERMISSOES

import React, { useState, useEffect } from 'react';
import { useAuthSimple } from '../hooks/useAuthSimple';
import type { DashboardProps } from '../types';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard de Produção - Acesso para Manipuladores
 */
export const DashboardProducao: React.FC<DashboardProps> = ({ usuario, permissoes }) => {
  const { logout } = useAuthSimple();
  const navigate = useNavigate();

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
                Dashboard de Produção
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                Manipulador
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Visão Geral da Produção */}
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
                      6 ordens
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
                      4 ordens
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
                      12 ordens
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Próximo Prazo */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Prazo Urgente
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      2h restantes
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
                Ações de Produção
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Minhas Ordens */}
                <a
                  href="/admin/producao"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Minhas Ordens</p>
                      <p className="text-xs text-gray-500">Acompanhar produção</p>
                    </div>
                  </div>
                </a>

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
                      <p className="text-sm font-medium text-gray-900">Iniciar Produção</p>
                      <p className="text-xs text-gray-500">Nova ordem</p>
                    </div>
                  </div>
                </a>

                {/* Controle de Qualidade */}
                <a
                  href="/admin/producao/controle-qualidade"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Controle de Qualidade</p>
                      <p className="text-xs text-gray-500">Verificar lotes</p>
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
                      <p className="text-xs text-gray-500">Verificar disponibilidade</p>
                    </div>
                  </div>
                </a>

              </div>
            </div>
          </div>

          {/* Ordens em Andamento */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Ordens em Andamento
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                
                {/* Ordem 1 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Ordem #001234</h4>
                      <p className="text-xs text-gray-500">Pomada Cicatrizante - 50g</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">70% concluído</p>
                    <p className="text-xs text-gray-500">Prazo: 2h</p>
                  </div>
                </div>

                {/* Ordem 2 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Ordem #001235</h4>
                      <p className="text-xs text-gray-500">Cápsula Vitamina D - 60 unid</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">30% concluído</p>
                    <p className="text-xs text-gray-500">Prazo: 4h</p>
                  </div>
                </div>

                {/* Ordem 3 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Ordem #001236</h4>
                      <p className="text-xs text-gray-500">Shampoo Anticaspa - 200ml</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">90% concluído</p>
                    <p className="text-xs text-gray-500">Prazo: 1h</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Estatísticas de Produtividade */}
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
                    156
                  </div>
                  <div className="text-sm text-gray-500">Ordens no Mês</div>
                </div>

                {/* Taxa de Sucesso */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    98.7%
                  </div>
                  <div className="text-sm text-gray-500">Taxa de Sucesso</div>
                </div>

                {/* Tempo Médio */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    2.1h
                  </div>
                  <div className="text-sm text-gray-500">Tempo Médio</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}; 