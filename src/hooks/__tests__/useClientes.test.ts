import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClientes, useCriarCliente } from './useClientes';
import { createWrapper } from '@/test/utils'; // Wrapper de teste com QueryClientProvider

// Mock das funções de API para não fazer chamadas reais
// Vitest automaticamente faz o hoist disso para o topo
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock do módulo de toast para evitar erros nos testes
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Importar o mock do supabase para poder manipulá-lo nos testes
import { supabase } from '@/lib/supabase';

describe('useClientes Hooks', () => {

  // Limpar os mocks depois de cada teste para garantir isolamento
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Testes para o hook `useClientes` (Listagem)
  describe('useClientes', () => {
    it('should fetch and return a list of clients', async () => {
      const mockClientes = [
        { id: '1', nome: 'Cliente Teste 1', email: 'teste1@email.com', ativo: true },
        { id: '2', nome: 'Cliente Teste 2', email: 'teste2@email.com', ativo: false },
      ];
      
      // Simular uma resposta de sucesso do Supabase
      const fromSpy = vi.spyOn(supabase, 'from');
      const selectSpy = vi.fn().mockReturnThis();
      const orderSpy = vi.fn().mockResolvedValue({ data: mockClientes, error: null });
      fromSpy.mockReturnValue({ select: selectSpy, order: orderSpy } as any);

      const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

      // Esperar a query ser finalizada
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockClientes);
      expect(result.current.data?.length).toBe(2);
      expect(fromSpy).toHaveBeenCalledWith('clientes');
    });

    it('should return an error when the fetch fails', async () => {
      const mockError = { message: 'Erro ao buscar clientes' };
      
      // Simular uma resposta de erro do Supabase
      const fromSpy = vi.spyOn(supabase, 'from');
      const selectSpy = vi.fn().mockReturnThis();
      const orderSpy = vi.fn().mockResolvedValue({ data: null, error: mockError });
      fromSpy.mockReturnValue({ select: selectSpy, order: orderSpy } as any);

      const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe(mockError.message);
    });
  });

  // Testes para o hook `useCriarCliente` (Mutations)
  describe('useCriarCliente', () => {
    it('should create a client successfully', async () => {
      const novoCliente = { nome: 'Novo Cliente', email: 'novo@email.com' };
      const clienteCriado = { id: '3', ...novoCliente, ativo: true };

      // Simular a resposta de sucesso do Supabase para a inserção
      const fromSpy = vi.spyOn(supabase, 'from');
      const insertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue({ data: clienteCriado, error: null });
      fromSpy.mockReturnValue({ insert: insertSpy, select: selectSpy, single: singleSpy } as any);
      
      const { result } = renderHook(() => useCriarCliente(), { wrapper: createWrapper() });
      
      // Executar a mutation
      result.current.mutate(novoCliente);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(fromSpy).toHaveBeenCalledWith('clientes');
      expect(insertSpy).toHaveBeenCalledWith([expect.objectContaining(novoCliente)]);
      expect(result.current.data).toEqual(clienteCriado);
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Cliente criado com sucesso!');
    });

    it('should handle server error on client creation', async () => {
      const novoCliente = { nome: 'Cliente Erro', email: 'erro@email.com' };
      const mockError = { message: 'Erro no servidor' };

      // Simular a resposta de erro do Supabase
      const fromSpy = vi.spyOn(supabase, 'from');
      const insertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue({ data: null, error: mockError });
      fromSpy.mockReturnValue({ insert: insertSpy, select: selectSpy, single: singleSpy } as any);
      
      const { result } = renderHook(() => useCriarCliente(), { wrapper: createWrapper() });
      
      result.current.mutate(novoCliente);

      await waitFor(() => expect(result.current.isError).toBe(true));
      
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe(mockError.message);
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Erro ao criar cliente', { description: mockError.message });
    });

    it('should handle CPF duplication error', async () => {
      const novoCliente = { nome: 'Cliente Duplicado', email: 'duplicado@email.com', cpf: '123' };
      const mockError = { code: '23505', message: 'duplicate key value violates unique constraint... cpf' };

      const fromSpy = vi.spyOn(supabase, 'from');
      const insertSpy = vi.fn().mockReturnThis();
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue({ data: null, error: mockError });
      fromSpy.mockReturnValue({ insert: insertSpy, select: selectSpy, single: singleSpy } as any);
      
      const { result } = renderHook(() => useCriarCliente(), { wrapper: createWrapper() });
      
      result.current.mutate(novoCliente);

      await waitFor(() => expect(result.current.isError).toBe(true));

      const expectedErrorMessage = 'Este CPF já está cadastrado no sistema';
      expect(result.current.error.message).toBe(expectedErrorMessage);
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Erro ao criar cliente', { description: expectedErrorMessage });
    });
  });
}); 