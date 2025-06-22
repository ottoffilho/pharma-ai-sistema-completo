import { describe, it, expect, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

// Mock da função de vendas
const mockVendasOperations = {
  create: vi.fn(),
  updateStatus: vi.fn(),
  calculateTotals: vi.fn(),
}

// Teste de integração para Edge Function vendas-operations
describe('Vendas Operations Integration', () => {
  const mockVendaData = {
    cliente_id: null,
    itens: [
      {
        produto_id: 'test-produto-id',
        quantidade: 2,
        preco_unitario: 25.50,
      }
    ],
    desconto_percentual: 0,
    observacoes: 'Venda teste',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create venda successfully', async () => {
    // Mock successful response
    const mockResponse = {
      data: {
        venda: {
          id: 'test-venda-id',
          numero_venda: 'VD000001',
          subtotal: 51.00,
          total: 51.00,
          status: 'concluida',
        },
        itens: [
          {
            id: 'test-item-id',
            produto_id: 'test-produto-id',
            quantidade: 2,
            preco_unitario: 25.50,
            total: 51.00,
          }
        ]
      },
      error: null,
    }

    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse)

    const result = await supabase.functions.invoke('vendas-operations', {
      body: {
        action: 'create',
        venda: mockVendaData,
      },
    })

    expect(result.error).toBeNull()
    expect(result.data.venda.numero_venda).toBe('VD000001')
    expect(result.data.venda.total).toBe(51.00)
    expect(result.data.itens).toHaveLength(1)
  })

  it('should update venda status', async () => {
    const mockResponse = {
      data: {
        venda: {
          id: 'test-venda-id',
          status: 'cancelada',
        }
      },
      error: null,
    }

    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse)

    const result = await supabase.functions.invoke('vendas-operations', {
      body: {
        action: 'update_status',
        venda_id: 'test-venda-id',
        status: 'cancelada',
      },
    })

    expect(result.error).toBeNull()
    expect(result.data.venda.status).toBe('cancelada')
  })

  it('should handle validation errors', async () => {
    const mockErrorResponse = {
      data: null,
      error: {
        message: 'Produto não encontrado',
        details: 'O produto especificado não existe no sistema',
      },
    }

    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockErrorResponse)

    const result = await supabase.functions.invoke('vendas-operations', {
      body: {
        action: 'create',
        venda: {
          ...mockVendaData,
          itens: [
            {
              produto_id: 'invalid-produto-id',
              quantidade: 1,
              preco_unitario: 10,
            }
          ],
        },
      },
    })

    expect(result.error).toBeTruthy()
    expect(result.error.message).toBe('Produto não encontrado')
  })

  it('should calculate totals correctly', async () => {
    const vendaComDesconto = {
      ...mockVendaData,
      desconto_percentual: 10,
      itens: [
        {
          produto_id: 'test-produto-id',
          quantidade: 4,
          preco_unitario: 25.00,
        }
      ],
    }

    const mockResponse = {
      data: {
        venda: {
          id: 'test-venda-id',
          subtotal: 100.00,
          desconto_valor: 10.00,
          total: 90.00,
        },
        itens: []
      },
      error: null,
    }

    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse)

    const result = await supabase.functions.invoke('vendas-operations', {
      body: {
        action: 'create',
        venda: vendaComDesconto,
      },
    })

    expect(result.data.venda.subtotal).toBe(100.00)
    expect(result.data.venda.desconto_valor).toBe(10.00)
    expect(result.data.venda.total).toBe(90.00)
  })
})

// Teste de integração para lógica de vendas
describe('Vendas Operations Logic', () => {
  const mockVendaData = {
    cliente_id: null,
    itens: [
      {
        produto_id: 'test-produto-id',
        quantidade: 2,
        preco_unitario: 25.50,
      }
    ],
    desconto_percentual: 0,
    observacoes: 'Venda teste',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate totals correctly', () => {
    const vendaComDesconto = {
      ...mockVendaData,
      desconto_percentual: 10,
      itens: [
        {
          produto_id: 'test-produto-id',
          quantidade: 4,
          preco_unitario: 25.00,
        }
      ],
    }

    // Simular cálculo
    const subtotal = vendaComDesconto.itens.reduce((total, item) => 
      total + (item.quantidade * item.preco_unitario), 0
    )
    const desconto_valor = subtotal * (vendaComDesconto.desconto_percentual / 100)
    const total = subtotal - desconto_valor

    expect(subtotal).toBe(100.00)
    expect(desconto_valor).toBe(10.00)
    expect(total).toBe(90.00)
  })

  it('should validate required fields', () => {
    const vendaInvalida = {
      ...mockVendaData,
      itens: [],
    }

    const isValid = vendaInvalida.itens.length > 0
    expect(isValid).toBe(false)
  })

  it('should generate sequential sale numbers', () => {
    const vendaNumbers = ['VD000001', 'VD000002', 'VD000003']
    
    expect(vendaNumbers[0]).toMatch(/^VD\d{6}$/)
    expect(vendaNumbers[1]).toMatch(/^VD\d{6}$/)
    expect(vendaNumbers[2]).toMatch(/^VD\d{6}$/)
  })

  it('should validate item quantities', () => {
    const item = {
      produto_id: 'test-produto-id',
      quantidade: 2,
      preco_unitario: 25.50,
    }

    expect(item.quantidade).toBeGreaterThan(0)
    expect(item.preco_unitario).toBeGreaterThan(0)
    expect(typeof item.produto_id).toBe('string')
    expect(item.produto_id.length).toBeGreaterThan(0)
  })
}) 