import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWhatsApp } from './useWhatsApp';
import { createWrapper } from '@/test/utils';

// Mocks
const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useWhatsApp Hooks', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  const { useConversas, useMensagens } = useWhatsApp();

  describe('useConversas Hook', () => {
    it('should fetch and return a list of conversations', async () => {
      const mockConversas = [
        { id: 'conversa-1', cliente_nome: 'Cliente 1', cliente_telefone: '111', status: 'aberto' },
        { id: 'conversa-2', cliente_nome: 'Cliente 2', cliente_telefone: '222', status: 'em_atendimento' },
      ];
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockConversas, error: null })
      });

      const { result } = renderHook(() => useConversas(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(result.current.data?.length).toBe(2);
      expect(result.current.data?.[0].cliente_nome).toBe('Cliente 1');
      expect(mockFrom).toHaveBeenCalledWith('conversas_atendimento');
    });

    it('should apply filters when fetching conversations', async () => {
      const mockConversaFiltrada = [
        { id: 'conversa-3', cliente_nome: 'Cliente 3', cliente_telefone: '333', status: 'resolvido' },
      ];
      
      const eqMock = vi.fn().mockReturnThis();
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: eqMock,
        // Mock da última chamada na cadeia para resolver a promessa
        limit: vi.fn().mockResolvedValue({ data: mockConversaFiltrada, error: null })
      });

      const filtros = { status: 'resolvido', limite: 1 };
      renderHook(() => useConversas(filtros), { wrapper: createWrapper() });
      
      // Checa se o filtro de status foi chamado corretamente
      await waitFor(() => {
          expect(eqMock).toHaveBeenCalledWith('status', 'resolvido');
      });
    });
  });

  describe('useMensagens Hook', () => {
    it('should fetch messages for a given conversation ID', async () => {
      const conversaId = 'conversa-1';
      const mockMensagens = [
        { id: 'msg-1', conversa_id: conversaId, conteudo: 'Olá', remetente_tipo: 'cliente' },
        { id: 'msg-2', conversa_id: conversaId, conteudo: 'Oi, como posso ajudar?', remetente_tipo: 'atendente' },
      ];
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMensagens, error: null })
      });

      const { result } = renderHook(() => useMensagens(conversaId), { wrapper: createWrapper() });
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.length).toBe(2);
      expect(result.current.data?.[0].conteudo).toBe('Olá');
      expect(mockFrom).toHaveBeenCalledWith('mensagens_atendimento');
      expect(mockFrom().eq).toHaveBeenCalledWith('conversa_id', conversaId);
    });

    it('should not fetch messages if conversation ID is not provided', () => {
      const { result } = renderHook(() => useMensagens(''), { wrapper: createWrapper() });
      
      // `enabled: !!conversaId` deve prevenir a execução
      expect(result.current.isFetching).toBe(false);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

}); 