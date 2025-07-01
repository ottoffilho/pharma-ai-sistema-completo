import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePDVv2 } from './usePDVv2';
import { createWrapper } from '@/test/utils';

// Mocks
const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'user-123' } } })),
    }
  },
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...original,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

const mockProduto = {
  id: 'prod-1',
  nome: 'Produto Teste',
  preco_venda: 10.00,
  estoque_atual: 100,
  controlado: false,
  requer_receita: false,
};


describe('usePDVv2 Hook', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
    expect(result.current.carrinho.itens).toEqual([]);
    expect(result.current.carrinho.total).toBe(0);
    expect(result.current.clienteSelecionado).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  describe('Carrinho Actions', () => {
    it('should add a new product to the cart', () => {
      const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });

      act(() => {
        result.current.adicionarProduto(mockProduto, 1);
      });

      expect(result.current.carrinho.itens.length).toBe(1);
      expect(result.current.carrinho.itens[0].produto_id).toBe('prod-1');
      expect(result.current.carrinho.itens[0].quantidade).toBe(1);
      expect(result.current.carrinho.subtotal).toBe(10);
      expect(result.current.carrinho.total).toBe(10);
    });

    it('should increase quantity if product already exists in cart', () => {
      const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });

      act(() => {
        result.current.adicionarProduto(mockProduto, 1);
      });
      act(() => {
        result.current.adicionarProduto(mockProduto, 2);
      });

      expect(result.current.carrinho.itens.length).toBe(1);
      expect(result.current.carrinho.itens[0].quantidade).toBe(3);
      expect(result.current.carrinho.subtotal).toBe(30);
      expect(result.current.carrinho.total).toBe(30);
    });

    it('should update the quantity of a product in the cart', () => {
      const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
      
      act(() => {
        result.current.adicionarProduto(mockProduto, 1);
      });
      act(() => {
        result.current.atualizarQuantidade('prod-1', 5);
      });

      expect(result.current.carrinho.itens.length).toBe(1);
      expect(result.current.carrinho.itens[0].quantidade).toBe(5);
      expect(result.current.carrinho.total).toBe(50);
    });

    it('should remove a product from the cart if quantity is updated to 0', () => {
      const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
      
      act(() => {
        result.current.adicionarProduto(mockProduto, 2);
      });
      act(() => {
        result.current.atualizarQuantidade('prod-1', 0);
      });

      expect(result.current.carrinho.itens.length).toBe(0);
      expect(result.current.carrinho.total).toBe(0);
    });

    it('should remove a product from the cart directly', () => {
      const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
      
      act(() => {
        result.current.adicionarProduto(mockProduto, 1);
      });
      act(() => {
        result.current.removerProduto('prod-1');
      });

      expect(result.current.carrinho.itens.length).toBe(0);
      expect(result.current.carrinho.total).toBe(0);
    });

    it('should not allow adding products when venda type is MANIPULADO', () => {
      const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
      
      act(() => {
        result.current.setTipoVenda('MANIPULADO');
      });
      act(() => {
        result.current.adicionarProduto(mockProduto, 1);
      });
      
      expect(result.current.carrinho.itens.length).toBe(0);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Venda MANIPULADO',
        variant: 'destructive',
      }));
    });
  });

  describe('Busca de Produtos', () => {
    it('should search for products and update the state', async () => {
        const mockResponse = { data: [mockProduto], error: null };
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(mockResponse)
        });

        const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
        
        await act(async () => {
            await result.current.buscarProdutos('Produto');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.produtos.length).toBe(1);
        expect(result.current.produtos[0].nome).toBe('Produto Teste');
    });
  });

  describe('Finalizar Venda', () => {
    it('should successfully finalize a sale', async () => {
        // Setup: Simular um caixa aberto
        const mockCaixaAberto = { id: 'caixa-1', data_abertura: new Date().toISOString(), ativo: true };
        const mockVendaCriada = { id: 'venda-1', total: 10.00 };
        
        // Mock das chamadas do supabase na ordem em que acontecem
        mockFrom
            .mockReturnValueOnce({ // 1. Verificar caixa aberto
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCaixaAberto, error: null })
            })
            .mockReturnValueOnce({ // 2. Inserir na tabela 'vendas'
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockVendaCriada, error: null })
            })
            .mockReturnValueOnce({ // 3. Inserir em 'itens_venda'
                insert: vi.fn().mockResolvedValue({ error: null })
            })
            .mockReturnValueOnce({ // 4. Inserir em 'venda_pagamentos'
                insert: vi.fn().mockResolvedValue({ error: null })
            })
            .mockReturnValueOnce({ // 5. Atualizar status da 'vendas'
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { ...mockVendaCriada, status: 'finalizada' }, error: null })
            });

        const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });
        
        // Adicionar item e pagamento
        act(() => {
            result.current.adicionarProduto(mockProduto, 1);
            result.current.adicionarPagamento({ forma_pagamento: 'dinheiro', valor: 10.00 });
        });

        // Finalizar a venda
        await act(async () => {
            await result.current.finalizarVenda();
        });

        // Asserções
        expect(result.current.isProcessando).toBe(false);
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Venda Finalizada!',
            description: `Venda #${mockVendaCriada.id} concluída com sucesso.`,
        }));
        // Verificar se as queries foram invalidadas para atualizar a UI
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['vendas'] });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['produtos'] });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['caixas'] });
        
        // Verificar se o carrinho foi limpo
        expect(result.current.carrinho.itens.length).toBe(0);
    });

    it('should show an error if no open cash register is found', async () => {
        // Simular nenhum caixa aberto
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null })
        });
        
        const { result } = renderHook(() => usePDVv2(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.finalizarVenda();
        });

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Erro ao Finalizar Venda',
            description: 'Nenhum caixa aberto encontrado.',
            variant: 'destructive',
        }));
    });
  });
}); 