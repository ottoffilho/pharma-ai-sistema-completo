import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Mock de dados de teste
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  nome: 'Usuário Teste',
  perfil: 'proprietario' as const,
  ativo: true,
  primeiro_acesso: false,
}

export const mockProduto = {
  id: 'test-produto-id',
  nome: 'Produto Teste',
  codigo_interno: 'PROD001',
  tipo: 'medicamento' as const,
  preco_custo: 10.00,
  markup_percentual: 50.00,
  preco_venda: 15.00,
  estoque_atual: 100,
  estoque_minimo: 10,
  ativo: true,
}

export const mockVenda = {
  id: 'test-venda-id',
  numero_venda: 'VD000001',
  usuario_id: 'test-user-id',
  subtotal: 100.00,
  desconto_valor: 0.00,
  total: 100.00,
  status: 'concluida' as const,
  status_pagamento: 'pago' as const,
}

// Provider simplificado para testes
interface AllTheProvidersProps {
  children: React.ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Função de render customizada
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-exportar tudo do testing library
export * from '@testing-library/react'
export { customRender as render }

// Utilitários para esperar por elementos async
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock factory para Edge Functions
export const createMockEdgeFunction = (response: any) => {
  return vi.fn().mockResolvedValue({
    data: response,
    error: null,
  })
}

// Helper para criar mocks de Context
export const createMockAuthContext = (overrides: Partial<typeof mockUser> = {}) => ({
  user: { ...mockUser, ...overrides },
  session: { user: { ...mockUser, ...overrides } },
  loading: false,
  signOut: vi.fn(),
  refetch: vi.fn(),
})

// Helper para simular erros de API
export const createMockError = (message: string) => ({
  data: null,
  error: { message, details: '', hint: '', code: '500' },
}) 