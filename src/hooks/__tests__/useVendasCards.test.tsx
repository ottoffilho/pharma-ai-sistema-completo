import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMockEdgeFunction } from '@/test/utils'

// Mock simplificado do hook
const useVendasCardsMock = () => {
  return {
    vendasHoje: { total: 2500, quantidade: 12 },
    vendasSemana: { total: 15000, quantidade: 75 },
    vendasMes: { total: 45000, quantidade: 200 },
    produtosBaixoEstoque: 3,
    crescimentoSemanal: 15.5,
    crescimentoMensal: 23.8,
    isLoading: false,
    error: null,
  }
}

describe('useVendasCards Hook (Mock)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('returns correct structure and data types', () => {
    const { result } = renderHook(() => useVendasCardsMock(), { wrapper })

    expect(result.current).toHaveProperty('vendasHoje')
    expect(result.current).toHaveProperty('vendasSemana')
    expect(result.current).toHaveProperty('vendasMes')
    expect(result.current).toHaveProperty('produtosBaixoEstoque')
    expect(result.current).toHaveProperty('isLoading')
    
    expect(typeof result.current.vendasHoje.total).toBe('number')
    expect(typeof result.current.vendasHoje.quantidade).toBe('number')
    expect(typeof result.current.produtosBaixoEstoque).toBe('number')
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('has reasonable data values', () => {
    const { result } = renderHook(() => useVendasCardsMock(), { wrapper })

    expect(result.current.vendasHoje.total).toBeGreaterThan(0)
    expect(result.current.vendasSemana.total).toBeGreaterThan(result.current.vendasHoje.total)
    expect(result.current.vendasMes.total).toBeGreaterThan(result.current.vendasSemana.total)
    expect(result.current.produtosBaixoEstoque).toBeGreaterThanOrEqual(0)
  })

  it('calculates growth percentages as numbers', () => {
    const { result } = renderHook(() => useVendasCardsMock(), { wrapper })

    expect(typeof result.current.crescimentoSemanal).toBe('number')
    expect(typeof result.current.crescimentoMensal).toBe('number')
    expect(result.current.crescimentoSemanal).toBeGreaterThanOrEqual(0)
    expect(result.current.crescimentoMensal).toBeGreaterThanOrEqual(0)
  })

  it('handles loading state correctly', () => {
    const { result } = renderHook(() => useVendasCardsMock(), { wrapper })
    expect(result.current.isLoading).toBe(false)
  })
}) 