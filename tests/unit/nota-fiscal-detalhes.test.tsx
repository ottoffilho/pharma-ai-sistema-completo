import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DetalhesNotaFiscal from '@/pages/admin/fiscal/nota-fiscal/[id]';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-id',
              numero_nf: '12345',
              serie: '1',
              status: 'PROCESSADA',
              chave_acesso: '12345678901234567890123456789012345678901234',
              data_emissao: '2024-01-01T10:00:00Z',
              valor_total_nota: 1000,
              valor_produtos: 900,
              valor_icms: 50,
              valor_ipi: 30,
              valor_pis: 10,
              valor_cofins: 10,
              created_at: '2024-01-01T10:00:00Z',
              updated_at: '2024-01-01T11:00:00Z',
              fornecedor: {
                id: 'fornecedor-id',
                razao_social: 'Fornecedor Teste LTDA',
                nome_fantasia: 'Fornecedor Teste',
                cnpj: '12.345.678/0001-90',
                logradouro: 'Rua Teste',
                numero: '123',
                bairro: 'Centro',
                cidade: 'São Paulo',
                uf: 'SP',
                cep: '01234-567'
              }
            },
            error: null
          })),
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 'item-1',
                numero_item: 1,
                codigo_produto: 'PROD001',
                descricao_produto: 'Produto Teste 1',
                ncm: '12345678',
                quantidade_comercial: 10,
                unidade_comercial: 'UN',
                valor_unitario_comercial: 50,
                valor_total_produto: 500,
                produto_criado: true
              },
              {
                id: 'item-2',
                numero_item: 2,
                codigo_produto: 'PROD002',
                descricao_produto: 'Produto Teste 2',
                ncm: '87654321',
                quantidade_comercial: 5,
                unidade_comercial: 'CX',
                valor_unitario_comercial: 80,
                valor_total_produto: 400,
                produto_criado: false
              }
            ],
            error: null
          }))
        }))
      })),
      in: vi.fn(() => Promise.resolve({
        data: [],
        error: null
      }))
    }))
  }
}));

// Mock do react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-id' })
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('DetalhesNotaFiscal', () => {
  it('deve exibir o skeleton durante o carregamento', () => {
    renderWithProviders(<DetalhesNotaFiscal />);
    
    expect(screen.getByText(/Carregando informações da nota fiscal/i)).toBeInTheDocument();
  });

  it('deve exibir os dados da nota fiscal após carregar', async () => {
    renderWithProviders(<DetalhesNotaFiscal />);
    
    await waitFor(() => {
      expect(screen.getByText('Nota Fiscal 12345')).toBeInTheDocument();
      expect(screen.getByText('Fornecedor Teste')).toBeInTheDocument();
      expect(screen.getByText('PROCESSADA')).toBeInTheDocument();
    });
  });

  it('deve exibir as tabs corretamente', async () => {
    renderWithProviders(<DetalhesNotaFiscal />);
    
    await waitFor(() => {
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      expect(screen.getByText('Itens')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Histórico')).toBeInTheDocument();
    });
  });

  it('deve calcular corretamente o total de impostos', async () => {
    renderWithProviders(<DetalhesNotaFiscal />);
    
    await waitFor(() => {
      // Total de impostos = 50 + 30 + 10 + 10 = 100
      expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
    });
  });
}); 