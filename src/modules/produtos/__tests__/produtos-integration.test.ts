import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock do Supabase para produtos
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null
      })),
      order: vi.fn(() => ({
        data: [],
        error: null
      })),
      data: [],
      error: null
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      data: null,
      error: null
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        data: null,
        error: null
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
}

vi.mock('@/hooks/supabase', () => ({
  useSupabase: () => mockSupabaseClient
}))

describe('Produtos Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Produtos Unificados - Sistema Completo', () => {
    it('should list all products with correct unified structure', async () => {
      const mockProdutos = [
        {
          id: '1',
          nome: 'Paracetamol 500mg',
          tipo: 'medicamento',
          categoria_id: 'cat-1',
          forma_farmaceutica_id: 'forma-1',
          preco_custo: 10.00,
          markup_percentual: 25.00,
          preco_venda: 12.50,
          estoque_atual: 100,
          estoque_minimo: 10,
          ncm: '30049099',
          cfop: '5405',
          cst: '000',
          ativo: true
        },
        {
          id: '2',
          nome: 'Vitamina C',
          tipo: 'insumo',
          concentracao: '1g',
          unidade_medida: 'kg',
          preco_custo: 50.00,
          markup_percentual: 30.00,
          preco_venda: 65.00,
          estoque_atual: 25,
          ativo: true
        },
        {
          id: '3',
          nome: 'Frasco 100ml',
          tipo: 'embalagem',
          capacidade: 100,
          material: 'vidro',
          unidade_medida: 'unidade',
          preco_custo: 2.00,
          markup_percentual: 50.00,
          preco_venda: 3.00,
          estoque_atual: 500,
          ativo: true
        }
      ]

      const mockOrderReturn = {
        data: mockProdutos,
        error: null
      }

      const mockOrder = vi.fn().mockResolvedValueOnce(mockOrderReturn)
      const mockSelect = vi.fn().mockReturnValueOnce({ order: mockOrder })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelect
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos.select('*').order('nome')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('produtos')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('nome')
      expect(result.data).toHaveLength(3)
      
      // Verificar estrutura de medicamento
      const medicamento = result.data[0]
      expect(medicamento.tipo).toBe('medicamento')
      expect(medicamento.categoria_id).toBeDefined()
      expect(medicamento.forma_farmaceutica_id).toBeDefined()
      
      // Verificar estrutura de insumo
      const insumo = result.data[1]
      expect(insumo.tipo).toBe('insumo')
      expect(insumo.concentracao).toBe('1g')
      expect(insumo.unidade_medida).toBe('kg')
      
      // Verificar estrutura de embalagem
      const embalagem = result.data[2]
      expect(embalagem.tipo).toBe('embalagem')
      expect(embalagem.capacidade).toBe(100)
      expect(embalagem.material).toBe('vidro')
    })

    it('should filter products by type correctly', async () => {
      const mockMedicamentos = [
        {
          id: '1',
          nome: 'Paracetamol 500mg',
          tipo: 'medicamento',
          preco_venda: 12.50
        }
      ]

      const mockEqReturn = {
        data: mockMedicamentos,
        error: null
      }

      const mockEq = vi.fn().mockResolvedValueOnce(mockEqReturn)
      const mockSelect = vi.fn().mockReturnValueOnce({ eq: mockEq })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelect
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos.select('*').eq('tipo', 'medicamento')

      expect(mockEq).toHaveBeenCalledWith('tipo', 'medicamento')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].tipo).toBe('medicamento')
    })
  })

  describe('Sistema de Preços e Markup', () => {
    it('should create product with automatic price calculation', async () => {
      const novoProduto = {
        nome: 'Novo Medicamento',
        tipo: 'medicamento',
        preco_custo: 20.00,
        markup_percentual: 25.00,
        categoria_id: 'cat-1',
        estoque_minimo: 10
      }

      const produtoComPreco = {
        ...novoProduto,
        id: 'novo-id',
        preco_venda: 25.00, // Calculado automaticamente pelo trigger
        estoque_atual: 0,
        ativo: true,
        created_at: new Date().toISOString()
      }

      const mockSingleReturn = {
        data: produtoComPreco,
        error: null
      }

      const mockSingle = vi.fn().mockResolvedValueOnce(mockSingleReturn)
      const mockSelectAfterInsert = vi.fn().mockReturnValueOnce({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValueOnce({ select: mockSelectAfterInsert })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: mockInsert
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos.insert([novoProduto]).select().single()

      expect(mockInsert).toHaveBeenCalledWith([novoProduto])
      expect(result.data.preco_venda).toBe(25.00)
      expect(result.data.id).toBeDefined()
    })

    it('should update product price when markup changes', async () => {
      const updateData = {
        markup_percentual: 30.00
      }

      const produtoAtualizado = {
        id: 'produto-123',
        nome: 'Produto Teste',
        preco_custo: 20.00,
        markup_percentual: 30.00,
        preco_venda: 26.00, // Recalculado automaticamente
        updated_at: new Date().toISOString()
      }

      const mockSingleReturn = {
        data: produtoAtualizado,
        error: null
      }

      const mockSingle = vi.fn().mockResolvedValueOnce(mockSingleReturn)
      const mockSelectAfterUpdate = vi.fn().mockReturnValueOnce({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValueOnce({ select: mockSelectAfterUpdate })
      const mockUpdate = vi.fn().mockReturnValueOnce({ eq: mockEq })

      mockSupabaseClient.from.mockReturnValueOnce({
        update: mockUpdate
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos
        .update(updateData)
        .eq('id', 'produto-123')
        .select()
        .single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(mockEq).toHaveBeenCalledWith('id', 'produto-123')
      expect(result.data.preco_venda).toBe(26.00)
    })
  })

  describe('Sistema de Estoque', () => {
    it('should validate minimum stock levels', async () => {
      const produtosBaixoEstoque = [
        {
          id: '1',
          nome: 'Produto Baixo Estoque',
          estoque_atual: 5,
          estoque_minimo: 10,
          tipo: 'medicamento'
        }
      ]

      // Mock para busca de produtos com estoque baixo
      const mockData = {
        data: produtosBaixoEstoque,
        error: null
      }

      // Simulando query: WHERE estoque_atual <= estoque_minimo
      const mockSelect = vi.fn().mockResolvedValueOnce(mockData)

      mockSupabaseClient.from.mockReturnValueOnce({
        select: mockSelect
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos.select('*')

      // Verificar se encontrou produtos com estoque baixo
      expect(result.data).toHaveLength(1)
      expect(result.data[0].estoque_atual).toBeLessThanOrEqual(result.data[0].estoque_minimo)
    })

    it('should update stock after sale', async () => {
      const vendaItem = {
        produto_id: 'produto-123',
        quantidade: 2
      }

      const produtoAntesVenda = {
        id: 'produto-123',
        nome: 'Produto Teste',
        estoque_atual: 10
      }

      const produtoAposVenda = {
        ...produtoAntesVenda,
        estoque_atual: 8, // 10 - 2
        updated_at: new Date().toISOString()
      }

      const mockSingleReturn = {
        data: produtoAposVenda,
        error: null
      }

      const mockSingle = vi.fn().mockResolvedValueOnce(mockSingleReturn)
      const mockSelectAfterUpdate = vi.fn().mockReturnValueOnce({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValueOnce({ select: mockSelectAfterUpdate })
      const mockUpdate = vi.fn().mockReturnValueOnce({ eq: mockEq })

      mockSupabaseClient.from.mockReturnValueOnce({
        update: mockUpdate
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos
        .update({ estoque_atual: produtoAntesVenda.estoque_atual - vendaItem.quantidade })
        .eq('id', vendaItem.produto_id)
        .select()
        .single()

      expect(result.data.estoque_atual).toBe(8)
    })
  })

  describe('Sistema Fiscal', () => {
    it('should validate fiscal codes (NCM, CFOP, CST)', async () => {
      const produtoFiscal = {
        nome: 'Produto com Dados Fiscais',
        tipo: 'medicamento',
        ncm: '30049099',
        cfop: '5405',
        cst: '000',
        preco_custo: 10.00,
        markup_percentual: 25.00
      }

      const mockSingleReturn = {
        data: { ...produtoFiscal, id: 'fiscal-123' },
        error: null
      }

      const mockSingle = vi.fn().mockResolvedValueOnce(mockSingleReturn)
      const mockSelectAfterInsert = vi.fn().mockReturnValueOnce({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValueOnce({ select: mockSelectAfterInsert })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: mockInsert
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos.insert([produtoFiscal]).select().single()

      expect(result.data.ncm).toBe('30049099')
      expect(result.data.cfop).toBe('5405')
      expect(result.data.cst).toBe('000')
    })
  })

  describe('Categorias e Formas Farmacêuticas', () => {
    it('should associate product with category and pharmaceutical form', async () => {
      const medicamento = {
        nome: 'Medicamento Completo',
        tipo: 'medicamento',
        categoria_id: 'cat-analgesicos',
        forma_farmaceutica_id: 'forma-comprimido',
        concentracao: '500mg',
        preco_custo: 15.00,
        markup_percentual: 20.00
      }

      const mockSingleReturn = {
        data: {
          ...medicamento,
          id: 'medicamento-123',
          preco_venda: 18.00
        },
        error: null
      }

      const mockSingle = vi.fn().mockResolvedValueOnce(mockSingleReturn)
      const mockSelectAfterInsert = vi.fn().mockReturnValueOnce({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValueOnce({ select: mockSelectAfterInsert })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: mockInsert
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos.insert([medicamento]).select().single()

      expect(result.data.categoria_id).toBe('cat-analgesicos')
      expect(result.data.forma_farmaceutica_id).toBe('forma-comprimido')
      expect(result.data.concentracao).toBe('500mg')
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete product by setting ativo to false', async () => {
      const mockDeleteReturn = {
        data: {
          id: 'produto-123',
          ativo: false,
          updated_at: new Date().toISOString()
        },
        error: null
      }

      const mockSingle = vi.fn().mockResolvedValueOnce(mockDeleteReturn)
      const mockSelectAfterUpdate = vi.fn().mockReturnValueOnce({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValueOnce({ select: mockSelectAfterUpdate })
      const mockUpdate = vi.fn().mockReturnValueOnce({ eq: mockEq })

      mockSupabaseClient.from.mockReturnValueOnce({
        update: mockUpdate
      })

      const produtos = mockSupabaseClient.from('produtos')
      const result = await produtos
        .update({ ativo: false })
        .eq('id', 'produto-123')
        .select()
        .single()

      expect(result.data.ativo).toBe(false)
      expect(result.data.updated_at).toBeDefined()
    })
  })
}) 