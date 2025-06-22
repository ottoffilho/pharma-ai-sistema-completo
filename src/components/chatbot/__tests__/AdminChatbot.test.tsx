import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AdminChatbot from '../AdminChatbot';

// Mock do Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
  getSupabaseFunctionUrl: vi.fn((name: string) => `https://mock-edge-function/${name}`),
}));

// Mock fetch global
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('AdminChatbot', () => {
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    global.fetch = vi.fn();
  });

  describe('Renderização', () => {
    it('deve renderizar o chatbot quando aberto', () => {
      render(<AdminChatbot {...defaultProps} />);
      
      expect(screen.getByText('Assistente Inteligente Pharma.AI')).toBeInTheDocument();
      expect(screen.getByText('Faça qualquer pergunta sobre seus dados em linguagem natural')).toBeInTheDocument();
    });

    it('não deve renderizar quando fechado', () => {
      render(<AdminChatbot {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Assistente Inteligente Pharma.AI')).not.toBeInTheDocument();
    });

    it('deve renderizar botões de ação rápida', () => {
      render(<AdminChatbot {...defaultProps} />);
      
      expect(screen.getByText('Meu Estoque')).toBeInTheDocument();
      expect(screen.getByText('Produtos Acabando')).toBeInTheDocument();
      expect(screen.getByText('Faturamento')).toBeInTheDocument();
      expect(screen.getByText('Receitas Hoje')).toBeInTheDocument();
    });

    it('deve renderizar campo de input e botão enviar', () => {
      render(<AdminChatbot {...defaultProps} />);
      
      expect(screen.getByPlaceholderText(/Pergunte qualquer coisa/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enviar mensagem/ })).toBeInTheDocument();
    });
  });

  describe('Mensagem inicial', () => {
    it('deve mostrar mensagem de boas-vindas quando não há histórico', async () => {
      render(<AdminChatbot {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Olá! Sou seu assistente inteligente/)).toBeInTheDocument();
      });
    });

    it('deve carregar histórico do localStorage quando disponível', () => {
      const mockHistory = JSON.stringify([
        {
          id: '1',
          text: 'Mensagem anterior',
          sender: 'user',
          timestamp: new Date().toISOString(),
        },
      ]);
      
      mockLocalStorage.getItem.mockReturnValue(mockHistory);
      
      render(<AdminChatbot {...defaultProps} />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('Envio de mensagens', () => {
    it('deve permitir digitar mensagem no input', async () => {
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Pergunte qualquer coisa/);
      await user.type(input, 'Como está meu estoque?');
      
      expect(input).toHaveValue('Como está meu estoque?');
    });

    it('deve enviar mensagem ao clicar no botão', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          botResponse: 'Seu estoque está bem!',
          records: null,
        }),
      };
      
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Pergunte qualquer coisa/);
      const button = screen.getByRole('button', { name: /Enviar mensagem/ });
      
      await user.type(input, 'Como está meu estoque?');
      await user.click(button);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-edge-function/admin-chat-agent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('deve limpar input após enviar mensagem', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          botResponse: 'Resposta do bot',
          records: null,
        }),
      };
      
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Pergunte qualquer coisa/);
      
      await user.type(input, 'Teste');
      await user.click(screen.getByRole('button', { name: /Enviar mensagem/ }));
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Ações rápidas', () => {
    it('deve executar ação rápida ao clicar em botão', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          botResponse: 'Informações do estoque...',
          records: [],
        }),
      };
      
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      await user.click(screen.getByText('Meu Estoque'));
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-edge-function/admin-chat-agent',
        expect.objectContaining({
          body: expect.stringContaining('Como está meu estoque?'),
        })
      );
    });
  });

  describe('Controles de interface', () => {
    it('deve fechar chatbot ao clicar no X', async () => {
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /Fechar assistente/ });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve limpar histórico ao clicar no botão de lixeira', async () => {
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /Limpar histórico/ });
      await user.click(clearButton);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('deve desabilitar botão enviar quando input está vazio', () => {
      render(<AdminChatbot {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /Enviar mensagem/ });
      expect(button).toBeDisabled();
    });

    it('deve habilitar botão enviar quando há texto no input', async () => {
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Pergunte qualquer coisa/);
      const button = screen.getByRole('button', { name: /Enviar mensagem/ });
      
      await user.type(input, 'teste');
      
      expect(button).not.toBeDisabled();
    });
  });

  describe('Estados de carregamento', () => {
    it('deve mostrar indicador de carregamento durante requisição', async () => {
      const mockResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              botResponse: 'Resposta após delay',
              records: null,
            }),
          });
        }, 100);
      });
      
      global.fetch = vi.fn().mockReturnValue(mockResponse);
      
      const user = userEvent.setup();
      render(<AdminChatbot {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Pergunte qualquer coisa/);
      await user.type(input, 'teste');
      await user.click(screen.getByRole('button', { name: /Enviar mensagem/ }));
      
      expect(screen.getByText(/Analisando sua pergunta/)).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para leitores de tela', () => {
      render(<AdminChatbot {...defaultProps} />);
      
      expect(screen.getByLabelText(/Digite sua mensagem/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Enviar mensagem/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fechar assistente/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Limpar histórico/)).toBeInTheDocument();
    });

    it('deve ter role log para área de mensagens', () => {
      render(<AdminChatbot {...defaultProps} />);
      
      expect(screen.getByRole('log')).toBeInTheDocument();
    });
  });
});